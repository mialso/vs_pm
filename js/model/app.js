;(function(glob) {
	"use strict";
	// early exit
	if (!glob.app || !glob.app.core) return;	

	// init static data
	var module_data = [
		"app",
		["log", "ui", "user", "net"],
		App_model,
		test
	];
    var model_ui = {
        guest: {
            ui: ["header", "main", "footer"],
            actions: {},
            models: ["user"]
        },
        manager: {
            ui: ["header", "main", "footer", "menu"],
            actions: {
                menu: [
					["logout", "app.core.user.logout()"]
				]
            },
            models: ["user", "project"]
        },
        admin: {
            ui: ["dash_main", "menu", "dash_header"],
            actions: {
                menu: [
					["logout", "app.core.user.logout()"]
				]
            },
            models: ["user", "project", "app"]
        }
    };

	//var users_data = {};
	var instance_ui_data = {};

	var core = glob.app.core;
	// load module
	var message = ["app_model"];
	var log = new core.Logger("module-app");
	core.data_loader.module = module_data;

	function App_model() {
		this.name = module_data[0];
		this.id = "model";
		log.info = "App_model(): new model create: name ="+this.name+"; id="+this.id+";";
		core.model.Model.call(this);

		this.message = message.concat([""]);

		this.get_config_data = get_config_data;

	}
	App_model.prototype = Object.create(core.model.Model.prototype);
	App_model.prototype.constructor = App_model;

	function get_config_data(user) {
		var data = model_ui[user.role_name];
		return data;
	}

	function test() {
		return 255;
	}
})(window);
