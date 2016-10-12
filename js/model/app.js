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
            ui: ["admin_main", "dash_main", "menu", "settings", "wiki", "menu_entry"],
            actions: {
				dash_main: [
					["show_wiki", "app.app.show_wiki()"],
					["show_settings", "app.app.show_settings()"],
					["show_health_check", "app.app.show_health_check()"]
				],
                menu: [
					["logout", "app.core.user.logout()"]
				],
				menu_entry: [
					["show", "app.app.show();"]
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

		this.get_config_data = get_config_data;

		this.show = core.task.create(["show", show_app]);
		this.show_wiki = core.task.create(["show_wiki", show_wiki]);
		this.show_settings = core.task.create(["show_settings", show_settings]);

		this.attrs.user_name = "err_name";
		this.attrs.role_name = "err_role";
	}
	App_model.prototype = Object.create(core.model.Model.prototype);
	App_model.prototype.constructor = App_model;

	function get_config_data(user) {
		var data = model_ui[user.role_name];
		this.attrs.user_name = user.name;
		this.attrs.role_name = user.role_name;
		return data;
	}

	function show_app() {
		this.ui["dash_main"].show = true;
		this.task.run_async("object", this.ui["dash_main"], "update");
	}
	function show_wiki() {
		this.ui["wiki"].show = true;
		this.task.run_async("object", this.ui["wiki"], "update");
	}
	function show_settings() {
		this.ui["settings"].show = true;
		this.task.run_async("object", this.ui["settings"], "update");
	}
	function test() {
		return 255;
	}
})(window);
