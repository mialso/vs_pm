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
					["login", "app.core.user.login([u_name.value, u_pass.value]);return false"]
				]
			}
		},
		manager: {},
		admin: {
			ui: ["menu_entry", "dash_main"],
			actions: {
				menu_entry: [
					["show", "app.user.show();"]
				]
			}
		}
	};
	var users_data = {};
	var instance_ui_data = {};

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
	}
	User_model.prototype = Object.create(core.model.Model.prototype);
	User_model.prototype.constructor = User_model;

	function get_config_data(user) {
		var data = model_ui[user.role_name];
		return data;
	}
	function get_model_config_data(user) {
		if (!instance_ui_data[user.role_name]) {
			return {};
		}
		return instance_ui_data[user.role_name];
	}
	function get_model_data(user) {
		if (!users_data[user.name]) {
			return [];
		}
		return users_data[user.name];
	}
	function show_users() {
		this.ui["dash_main"].show = true;
		this.task.run_async("object", this.ui["dash_main"], "update");
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
		this.name = data[1];
		core.model.Model.call(this);

		this.actions = config.actions;
		this.ui_config = config.ui;
	}
	User.prototype = Object.create(core.model.Model.prototype);
	User.prototype.constructor = User;

	function test() {
		return 255;
	}
})(window);
