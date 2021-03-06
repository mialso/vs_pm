;(function(glob) {
	"use strict";
	// early exit
	if (!glob.app || !glob.app.core) return;	

	// init static data
	var module_data = [
		"project",
		["ui", "user", "net", "log"],
		Project_model,
		test
	];
	var projects_data = {
		vasil: [
			"0001:project_1",
			"0002:project_2",
			"0003:project_X"
		],
		super: [
			"0004:project_43",
			"0005:project_84"
		]
	};
	var model_ui = {
		guest: {},
		manager: {},
		admin: {
			ui: ["menu_entry", "dash_main", "templates"],
			actions: {
				menu_entry: [
					["show", "app.project.show(id);"]
				]
			}
		}
	};
	var instance_ui_data = {
		guest: {},
		manager: {},
		admin: {
			ui: ["instance_entry"],
			actions: {
				instance_entry: [
					["details", "app.project.details(id);"],
					["update", "app.project.update(id);"]
				]
			}
		}
	};
	var core = glob.app.core;
	// load module
	var log = new core.Logger("module-project");
	core.data_loader.module = module_data;

	function Project_model() {
		this.name = module_data[0];
		this.id = "model";
		log.info = "Project_model(): new model create: name ="+this.name+"; id="+this.id+";";

		core.model.Model.call(this);

		this.Instance = Project;

		this.get_config_data = get_config_data;
		this.get_model_config_data = get_model_config_data;
		this.get_model_data = get_model_data;

		this.show = core.task.create(["show", show_projects]);

		this.details = function(data) {
			//console.log("details not implemented yet, data ="+data.attributes.getNamedItem("yaf_id").value);
			console.log("data ="+data);
			console.log("%o", arguments);
		}
		this.update = function() {
			console.log("update not implemented yet");
		}

	}
	Project_model.prototype = Object.create(core.model.Model.prototype);
	Project_model.prototype.constructor = Project_model;

	function get_config_data(user) {
		return model_ui[user.role_name];
	}
	function get_model_config_data(user) {
		if (!instance_ui_data[user.role_name]) {
			this.task.error("get_model_config_data(): no instance config available for user.role_name ["+user.role_name+"]");
			return;
		}
		this.task.run_async("object", this, "add_instance_config", instance_ui_data[user.role_name]);
	}
	function get_model_data(user) {
		var instances = projects_data[user.name];
		for (var i = 0; i < instances.length; ++i) {
			this.task.run_async("object", this, "add_instance", instances[i].split(":"));
		}
	}

	function show_projects(id) {
		if (!id || ("model" !== id)) {
			this.task.error("uknown instance id to show");
			return;
		}
		this.ui["dash_main"].show = true;
		this.task.run_async("object", this.ui["dash_main"], "update");
	}
				
	function Project(data, config) {
		var func = "Project(): ";
		if (!Array.isArray(data) || (2 > data.length)) {
			log.error = func+" wrong data ="+JSON.stringify(data)+"; provided;";
			return;
		}
		log.info = "Project(): new project ="+JSON.stringify(data);

		this.id = data[0];
		this.name = "project";

		core.model.Model.call(this);

		this.attrs.description = data[1];
		// service data
		// TODO the question about user ????
		//this.get_config_data = get_config_data;
		this.actions = config.actions;
		this.ui_config = config.ui;
	}
	Project.prototype = Object.create(core.model.Model.prototype);
	Project.prototype.constructor = Project;

	function test() {
		return 255;
	}
})(window);
