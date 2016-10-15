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
					["stop_edit", "app.user.stop_edit(event, id)"]
				],
				data_card: [
					["update_user", "app.user.add_new_user([u_name.value, u_key.value, u_role.value]);modal_1.checked=false;return false;"]
				]
			}
		}
	};
	// TODO move role to standalone model
	var role_names = ["guest", "manager", "admin"];
	var instance_ui_data = {
		guest: {},
		manager: {},
		admin: {
			ui: ["table_instance"],
			actions: {
				table_instance: [
					["update", "app.user.update(event, id);"],
					["save_update", "app.user.save_user([event, id]);"]
				]
			}
		}
	};
	var user_attrs_names = ["name", "key", "role_id"];

	var core = glob.app.core;
	// load module
	var log = new core.Logger("module-user");
	core.data_loader.module = module_data;

	var user_edit_element = null;
	var edit_check_elem = null;
	var tmp_click = null;

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

		this.update = core.task.create(["update", update_user]);
		this.stop_edit = core.task.create(["stop_edit", stop_edit_user]);
		this.save_user = core.task.create(["save_user", save_user]);
		this.add_new_user = core.task.create(["add_new_user", add_new_user]);
	}
	User_model.prototype = Object.create(core.model.Model.prototype);
	User_model.prototype.constructor = User_model;

	function save_user([event, id]) {
		var yaf_element = glob.document.querySelector("[yaf_id=\""+user_edit_element+"\"]");
		if (!yaf_element) {
			this.task.error("no yaf_element found");
			return;
		}
		var inputs = yaf_element.querySelectorAll(".u_input");
		var user_data_updated = [];
		for (var i=0; i < inputs.length; ++i) {
			var data_ind = user_attrs_names.indexOf(inputs[i].name);
			if (-1 !== data_ind) {
				user_data_updated[data_ind] = inputs[i].value;
			}
		}
		this.task.debug("new user data = "+JSON.stringify(user_data_updated));
		
		event.stopPropagation();
			/*
		this.task.error("test error");
		return;
			*/
		function handler(data) {
			if ("|" !== data[0]) {
				yaf_element.classList.toggle("edit");
				this.task.error("save_user(): handler(): server data not valid ="+data+";");
				return;
			}
			var new_data = data.slice(1).split(":");
			var ui_elem = this.instances[id].ui["table_instance"];
			this.instances[id].attrs.login_name = new_data[1];
			ui_elem.attr = ["login_name", new_data[1]];
			this.instances[id].attrs.password = new_data[2];
			ui_elem.attr = ["password", new_data[2]];
			this.instances[id].attrs.role = role_names[new_data[3]];
			ui_elem.attr = ["role", role_names[new_data[3]]];
			this.instances[id].attrs.role_id = new_data[3];
			ui_elem.attr = ["role_id", new_data[3]];

			this.task.run_async("object", ui_elem, "update");
			// TODO refactor - the same as stop edit
			//yaf_element.classList.toggle("edit");
			//yaf_element.onclick = tmp_click;
			this.task.result = "user update [OK]";
		}
		var updated_user_data = user_data_updated.join(",");
		// perform request
		this.task.run_async("core", "net", "req_put", ["?users", handler.bind(this), updated_user_data]);
		glob.document.getElementById("table_edit_check").classList.toggle("edit");
		tmp_click = null;
		user_edit_element = null;
	}
	function stop_edit_user(event, id) {
		glob.document.getElementById("table_edit_check").classList.toggle("edit");
		var yaf_element = glob.document.querySelector("[yaf_id=\""+user_edit_element+"\"]");
		if (!yaf_element) {
			return;
		}
		yaf_element.classList.toggle("edit");
		yaf_element.onclick = tmp_click;
		tmp_click = null;
		user_edit_element = null;
		event.stopPropagation();
			/*
		var inputs = yaf_element.querySelectorAll("input");
		for (var i=0; i < inputs.length; ++i) {
			inputs[i].disabled = true;
		}
			*/
	}
	function update_user(event, data) {
		if (user_edit_element) {
			return;
		}
		glob.document.getElementById("table_edit_check").classList.toggle("edit");
		
		var body = glob.document.body;
		var html = glob.document.documentElement;
		var height = Math.max( body.scrollHeight, body.offsetHeight, 
				html.clientHeight, html.scrollHeight, html.offsetHeight );

		glob.document.getElementById("table_edit_check").style = "height:"+height+"px;";

		var yaf_element = event.target;
		while (null === yaf_element.getAttribute("yaf_id")) {
			yaf_element = yaf_element.parentElement;
		}
		yaf_element.classList.toggle("edit");
		tmp_click = yaf_element.onclick;
		yaf_element.onclick = function() {};
		user_edit_element = yaf_element.getAttribute("yaf_id");
			/*
		var inputs = yaf_element.querySelectorAll("input");
		for (var i=0; i < inputs.length; ++i) {
			inputs[i].disabled = false;
		}
			*/
	}
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
			if ("|" !== user_data[0]) {
				this.task.error("get_user(): handler(): server data not valid ="+user_data+";");
				return;
			}
			var user = user_data.slice(1).split(":");
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
			this.task.error("get_model_config_data(): no instance config available for user.role_name ["+user.role_name+"]");
			return;
		}
		this.task.run_async("object", this, "add_instance_config", instance_ui_data[user.role_name]);
	}
	function get_model_data(user) {
		if ("admin" !== user.role_name) {
			return;
		}
		function handler(data) {
			if ("|" !== data[0]) {
				this.task.error("get_model_data(): handler(): server data not valid ="+data+";");
				return;
			}
			var instances = data.slice(1).split("|");
			for (var i = 0; i < instances.length; ++i) {
				this.task.run_async("object", this, "add_instance", instances[i].split(":"));
			}
		}
		this.task.run_async("core", "net", "req_get", ["?users/name=all", handler.bind(this)]);
	}

	function show_users() {
		this.ui["dash_main"].show = true;
		this.task.run_async("object", this.ui["dash_main"], "update");
	}
		/*
	function hide_user() {
		this.ui["table_instance"].show = false;
		this.task.run_async("object", this.ui["table_instance"], "update");
	}
		*/
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
		this.attrs.role_id = data[3];

		this.actions = config.actions;
		this.ui_config = config.ui;
	}
	User.prototype = Object.create(core.model.Model.prototype);
	User.prototype.constructor = User;

	function test() {
		return 255;
	}
})(window);
