;(function(glob) {
	"use strict";
	// early exit
	if (!glob.app || !glob.app.core) return;	

	// init static data
	var module_data = [
		"user",
		["log", "ui", "user", "net"],
		User_model,
		test
	];
	var model_ui = {
		guest: {
			ui: ["login"],
			actions: {
 				login: [
						/*
					["login", "app.core.user.login([u_name.value, u_pass.value]);return false"]
						*/
					["login", "app.user.login([u_name.value, u_pass.value]);return false"]
				]
			}
		},
		manager: {},
		admin: {
			ui: ["menu_entry", "dash_main", "data_card"],
			actions: {
				menu_entry: [
					["show", "app.user.show();"]
				],
				dash_main: [
					//["add_new_user", "app.user.add_new_user()"]
				],
				data_card: [
					["update_user", "app.user.add_new_user([u_name.value, u_key.value, u_role.value]);modal_1.checked=false;return false;"]
				]
			}
		}
	};
	// TODO move role to standalone model
	var role_names = ["guest", "manager", "admin"];
		/*
	var users_data = {
		admin: [
			["0001", "vasil", "123", "admin"],
			["0002", "petro", "456", "manager"],
			["0003", "stranger", "17", "manager"]
		]
	};
		*/
	var instance_ui_data = {
		guest: {},
		manager: {},
		admin: {
			ui: ["table_instance"],
			actions: {
				table_instance: [
					["update", "app.user.update(id);"]
				]
			}
		}
	};

	var core = glob.app.core;
	// load module
	var log = new core.Logger("module-user");
	core.data_loader.module = module_data;

	function User_model() {
		this.name = module_data[0];
		this.id = "model";
		log.info = "User_model(): new model create: name ="+this.name+"; id="+this.id+";";
		core.model.Model.call(this);

		this.name = "user";
		this.Instance = User;

		this.get_config_data = get_config_data;
		this.get_model_config_data = get_model_config_data;
		this.get_model_data = get_model_data;

		this.show = core.task.create(["show", show_users]);
		this.login = core.task.create(["login", login]);

		this.update = function(data) {
			console.log("user update: data = %s", data);
		}
		this.add_new_user = core.task.create(["add_new_user", add_new_user]);
				/*
		this.add_new_user = function(data) {
			console.log("add new user: [%s:%s:%s]", data[0], data[1], data[2]);
			//glob.document.getElementById("modal-1").checked = false;
		}
				*/
	}
	User_model.prototype = Object.create(core.model.Model.prototype);
	User_model.prototype.constructor = User_model;

	function login(data) {
		var func = "login(): ";
		this.task.debug(func+"data ="+JSON.stringify(data));

		if (!data || !Array.isArray(data) || 2 !== data.length) {
			this.task.error(func+"data is not valid;");
			return;
		}
		get_user.call(this, data);
	}
	function get_user(data) {
		// create handler
		function handler(user_data) {
			if ("epic_fail" === user_data) {
				this.task.error("get_user(): handler(): data ="+user_data+";");
				return;
			}
			var user = user_data.slice(1).split(":");
			console.log("DDDUUU: %o", user);
			this.task.run_async("core", "user", "init_user", user);
		}
		
		// perform request
		this.task.run_async("core", "net", "req_get", ["?users/name="+data[0]+"/key="+data[1], handler.bind(this)]);
	}


	function get_config_data(user) {
		var data = model_ui[user.role_name];
		return data;
	}
	function get_model_config_data(user) {
		if (!instance_ui_data[user.role_name]) {
			this.instance_config = {};
		}
		this.instance_config = instance_ui_data[user.role_name];
	}
	function get_model_data(user) {
		if ("admin" !== user.role_name) {
			return;
		}
		function handler(data) {
			this.instances_data = data;
		}
		this.task.run_async("core", "net", "req_get", ["?users/name=all", handler.bind(this)]);
	}

	function show_users() {
		this.ui["dash_main"].show = true;
		this.task.run_async("object", this.ui["dash_main"], "update");
	}
	function add_new_user(data) {

		var user_data = data[0]+","+data[1]+","+data[2];
		function handler(data) {
				console.log("add_User_handler, data =%s;%s", data, data[0]);
			if ("|" !== data[0]) {
				this.task.error("add_new_user(): handler(): server reported error ="+data);
				return;
			}
			this.add_instance(data.slice(1).split(":"));
		}
		this.task.run_async("core", "net", "req_post", ["?users/", handler.bind(this), user_data]);
	}

	function User(data, config) {
		var func = "User(): ";
		if (!data) {
			log.error = func+"no user data provided ="+data;
			return;
		} else {
			log.info = func+" new user ="+JSON.stringify(data);
		}

		this.id = data[0];
		this.name = "user";		// TODO this is model_name, not the user name
		core.model.Model.call(this);

		this.attrs.login_name = data[1];
		this.attrs.password = data[2];
		this.attrs.role = role_names[data[3]];

		this.actions = config.actions;
		this.ui_config = config.ui;
	}
	User.prototype = Object.create(core.model.Model.prototype);
	User.prototype.constructor = User;

	function test() {
		return 255;
	}
})(window);
