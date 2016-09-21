;(function(glob) {
	"use strict";
	// TODO early exit, test container functionality
	// define static data
	
	// create app resources
	var browser_state;
	var core_debug = ["", "", "", "", "", ""];
	glob.core_debug = core_debug;

	// create app object in container
	glob.app = {};
	glob.app.core  = new Core();
	var core = glob.app.core;
	
	glob.onload = function() {
		core.browser = "ready";
	};
	var log;

	// module constructor
	function Core() {
		this.debug = core_debug;
		this.core_loader = new Loader(this, this, "core");
		this.data_loader = new Loader(glob.app, this, "app");
		this.test = new Tester();
		log = new Logger("core-log");
		Object.defineProperty(this, "browser", {
			set: browser_event_handler,
			get: function() { return browser_state; }
		});
		this.Logger = Logger;
	}
	function browser_event_handler(message) {
		switch (message) {
			case "ready":
				browser_state = "ready";
				for (var i = 0; i < core.core_loader.module.length; ++i) {
					if (undefined !== core.core_loader.loaded[i]) {
						core.test.test = core.core_loader.module[i];
					}
				}
				for (var i = 0; i < core.data_loader.module.length; ++i) {
					if (undefined !== core.data_loader.loaded[i]) {
						core.test.test = core.data_loader.module[i];
					}
				}
				core.user.login();
				break;
			default:
				break;
		}
	}
	function Loader(parent_obj, dep_obj, name) {
		var log = new Logger(name + "-loader");
		var modules = [];
		var not_loaded_names = [];
		var loaded_names = [];
		var broken_modules = [];
		Object.defineProperty(this, "module", {
			set: add_module,
			get: function() { return modules; }
		});
		Object.defineProperty(this, "loaded", {
			set: function(d) { return null; },
			get: function() { return loaded_names; }
		});
		Object.defineProperty(this, "not_loaded", {
			set: function(d) { return null; },
			get: function() { return not_loaded_names; }
		});
		Object.defineProperty(this, "log", {
			set: function(d) { return null; },
			get: function() { return log; }
		});
		Object.defineProperty(this, "broken", {
			set: remove_module,
			get: function() { return broken_modules; }
		});
		function remove_module(module) {
			// TODO :possible graph implementation
		}
		function add_module(module) {
			var index = modules.push(module);
			--index;
			log.info = "add_module(): new module <" + module[0] + "> at index "+index;
			if (not_loaded_names[index] !== undefined) {
				log.error = "add_module(): not_loaded_names index exists at [" + index + "] for " + modules.pop()[0];
				return;
			}
			not_loaded_names[index] = module[0];
			load_module(module, index);
		}
		function load_module(module, index) {
			log.info = "load_module(): to be loaded <"+module[0]+"> with index "+index;
			// already loaded or the name is occupied
			if (parent_obj.hasOwnProperty(module[0])) {
				log.error = "load_module(): module <"+ module[0] + "> is already exists";
				return;
			}
			var dependencies_ok = true;
			var modules_loaded = Object.keys(dep_obj);
 			log.info = "load_module(): core modules loaded: " + modules_loaded;
			for (var i=0; i < module[1].length; ++i) {
				if (-1 === modules_loaded.indexOf(module[1][i])) {
					dependencies_ok = false;
				}
			}
			if (dependencies_ok) {
				parent_obj[module[0]] = new module[2]();
/*
				// TODO try to implement this throw ongoing tasks
				var new_module = new module[2]();
				new_module.log = new core.log.Module([new_module.name, new_module.id]);
				new_module.task = new Task([new_module.name, new_module.id]);
				core.model.Model.call(new_module);
*/
				
				log.info = "load_module(): module <"+ module[0] + "> loaded as <" + parent_obj[module[0]] + ">";
				loaded_names[index] = module[0];
				not_loaded_names[index] = undefined;
				// try to load others, who waits
				for (var i=0; i < modules.length; ++i) {
					if (undefined === not_loaded_names[i]) {
						continue;
					}
					load_module(modules[i], i);
				}
			}
		}
	}
	function Tester() {
		var tests = [];
		var log = new Logger("core-test");
		var success_tests = [];
		var error_tests = [];
		Object.defineProperty(this, "log", {
			set: function(d) {return null;},
			get: function() {return log;}
		});
		Object.defineProperty(this, "test", {
			set: module_test,
			get: function() { return tests; }
		});
		Object.defineProperty(this, "success", {
			set: function(data) {
				success_tests.push(data);
				log.info = "module_test(): success <"+data+"> test";
			},
			get: function() { return success_tests; }
		});
		Object.defineProperty(this, "error", {
			set: function(data) {
				error_tests.push(data);
				log.error = "module_test(): error in <"+data+"> test";
			},
			get: function() { return error_tests; }
		});
		function module_test(module) {
			var module_name = module[0];
			tests.push(module_name);
			var result = module[3]();
			(0 == result) ? this.success = module_name : this.error = module_name;
		}
	}
	function Logger(name) {
		var error_log = [];
		var info_log = [];
		var module_name = name.toUpperCase();
		var debug = core_debug.indexOf(name.split("-").pop());
		Object.defineProperty(this, "error", {
			set: function(data) {
				var message = "[ERROR]: <"+module_name+">: " + data;
				error_log.push(message);
				if (-1 !== debug || "off" !== core_debug[0]) {
					console.log(message);
				}
			},
			get: function() {
				if (0 === error_log.length) {
					console.log("[LOG]: <"+module_name+">: {ERROR}: empty");
					return;
				}
				for (var i = 0; i < error_log.length; ++i) {
					console.log(error_log[i]);
				}
			}
		});
		Object.defineProperty(this, "info", {
			set: function(data) {
				var message = "[INFO]: <"+module_name+">: " + data;
				info_log.push(message);
				if (-1 !== debug || "all" === core_debug[0]) {
					console.log(message);
				}
			},
			get: function() {
				if (0 === info_log.length) {
					console.log("[LOG]: <"+module_name+">: {INFO}: empty");
					return;
				}
				for (var i = 0; i < info_log.length; ++i) {
					console.log(info_log[i]);
				}
			}
		});
	}
})(window);
;(function(glob) {
	"use strict";
	// early exit
	if (!glob.app || !glob.app.core) return;
	
	// define static data
	var module_data = [
		"ui_container",
		["log", "task"],
		UI_container,
		test
	];
	// create app resources
	var containers = {};
	var el_queue = {};

	// load module consrtuctor to app
	var core = glob.app.core;
	var log = new core.Logger("ui_container");
	core.core_loader.module = module_data;

	// module constructor
	function UI_container() {
		this.global_id = "ui_container>model";
		// interface
		this.update_container = core.task.create(["update_container", update_container]);
		this.create = core.task.create(["create", create_container]);
		this.clean_up = core.task.create(["clean_up", clean_up]);
		// service
		this.get = function() { return JSON.stringify(containers);};
		this.get_conts = function() { return containers;};
		this.get_log = function() { return log;};
	}
	/* 
	 * purspose: clean up
	 */
	function clean_up() {
		containers = {};
	}
	function update_container(elem) {
		var func = "update_container(): ";
		var cont_name = elem.parent_container;
		// if container is not loaded yet, put element to queue
		if (!containers[cont_name]) {
			// create queue if absent
			if (undefined === el_queue[cont_name]) {
				this.task.debug(func+"new el_queue ="+cont_name);
				el_queue[cont_name] = [];
			}
			el_queue[cont_name].push(elem);
			this.task.result = elem.global_id+" in el_queue";
		} else {
			this.task.run_sync("object", containers[cont_name], "update", elem);
		}
	}
	function create_container([name, type, children]) {
		var func = "create_container(): ";
		containers[name] = new Container(name, type, children);
		if ("body" === name) {
			this.task.run_sync("object", containers[name], "parent_ready", true);
		}
		this.task.debug(func+"container \""+name+"\" added;");
		if (undefined !== el_queue[name]) {
			while(0 < el_queue[name].length) {
				this.task.debug(func+"element \""+el_queue[name][0].name+" inserted to container \""+name+"\"");
				this.task.run_sync("object", containers[name], "update", el_queue[name].shift());
			}
		}
	}
	function Container(name, type, elems) {
		this.name = name;
		this.global_id = "container>"+name;
		var func = "Container(): ";

		this.type = type;
		// interface
		this.update = core.task.create(["update", update_element]);
		this.parent_ready = core.task.create(["parent_ready", add_to_parent]);

		// service static functions, to be used by tasks
		this.get_elem_id = function(elem) {
			return elem.name;
		};
		this.get_elem_index = function(el_id) {
			return this.elem_names.indexOf(el_id);
		};
		this.add_element = function(el_id) {
			return this.elem_names.push(el_id)-1;
		};
		// override specific to container type services
		switch (this.type) {
			case "single":
				break;
			case "table":
				break;
			case "named":
				this.add_element = function(el_id) {
					return -1;
				};
				break;
			case "list": 
				break;
			default:
				log.error = func+"unknown container type \""+type+"\"";
				break;
		}
		log.info = func+"new <"+this.name+">: type ="+type+"; elems ="+elems;
		//this.parent_element = name.split("_").slice(0,-1).join("_");

		this.head = name.split("_").join(" .");

		this.elem_names = elems;
		this.elems = [];
		this.loaded = [];
		this.shown = [];

		this.parent_ready_bool = false;
	}
	/*
	* purpose: to update element within container
	* context: Container
	*/
	function update_element(elem) {
		var func = "update_element(): ";
		if (elem_is_not_valid.call(this, elem)) return;
		var el_id = this.get_elem_id(elem);
		var elem_ind = this.get_elem_index(el_id);
		// add element id to container elems
		if (-1 === elem_ind) {
			elem_ind = this.add_element(el_id);
			if ("single" === this.type) {
				elem.show = false;
			}
		}
		if (-1 === elem_ind) {
			this.task.error(func+"unable to add element to container");
			return;
		} else {
			this.task.debug(func+"element added successfully");
		}
		// update element data
		this.elems[elem_ind] = elem;
		this.task.debug(func+"\""+el_id+"["+elem_ind+"]\" updated");
		// mark loaded elements
		this.loaded[elem_ind] = this.elem_names[elem_ind];
		this.task.debug(func+"\""+elem.name+"\" is loaded, ind ="+elem_ind);
		// check if container is in dom already and is able to insert elements
		if (!this.parent_ready_bool) {
			this.task.result = this.loaded[elem_ind]+" is loaded to \""+this.global_id+"\"";
			return;
		}

		if (elem.show) {
			show.call(this, elem_ind);
		} else {
			hide.call(this, elem_ind);
		}
	}
	/*
	 * purpose: to show element
	 * context: Container
	 */
	function show(elem_ind) {
		if (this.shown[elem_ind]) {
			hide.call(this, elem_ind);
		}
		// if new containers added - call parent ready on each
		var elem = this.elems[elem_ind];
		if (0 < elem.containers.length) {
			for (var i = 0; i < elem.containers.length; ++i) {
				var name = elem.containers[i];
				if (!containers[name]) {
					this.task.error("the inserted container \""+name+"\" is "+containers[name]);
					return;
				}
				this.task.run_async("object", containers[name], "parent_ready", true);
			}
		}
		// TODO if change call fails, this should not be true
		this.shown[elem_ind] = true;
		this.task.debug(this.elems[elem_ind].global_id+" is shown ="+this.shown[elem_ind]);

		change.call(this, elem_ind);
	}
	/*
	 * purpose: to hide element
	 * context: Container
	 */
	function hide(elem_ind) {
		this.elems[elem_ind].show = false;
		var elem = this.elems[elem_ind];
		if (0 < elem.containers.length) {
			for (var i = 0; i < elem.containers.length; ++i) {
				var name = elem.containers[i];
				if (!containers[name]) {
					this.task.error("the inserted container \""+name+"\" is "+containers[name]);
					return;
				}
				containers[name].parent_ready_bool = false;
				this.task.debug("container \""+name+"\" parent ready ="+containers[name].parent_ready_bool);
			}
		}
		this.shown[elem_ind] = false;
		this.task.debug(this.elems[elem_ind].global_id+" is shown ="+this.shown[elem_ind]);

		dom_update.call(this, elem_ind, glob.document.createElement("div"));
	}
	/*
	 * purpose: to create dom-element from element and exchange it in container with old one
	 * context: Container
	 */
	function change(el_ind) {
		var func = "change(): ";
		var tmp_node;
		if ("table" === this.type) {
			tmp_node = glob.document.createElement("table");
		} else {
			tmp_node = glob.document.createElement("div");
		}
		tmp_node.innerHTML = this.elems[el_ind].html.join("").replace(/[\n\t]/g, "");
		if (!tmp_node.firstChild || (tmp_node.firstChild.nodeType !== Node.ELEMENT_NODE)) {
			this.task.error("unable to create new element: not valid string ="+this.elems[el_ind].html.join("").replace(/[\n\t]/g, ""));
			return;
		}
		tmp_node.firstChild.setAttribute("yaf_id", this.elems[el_ind].global_id);
		this.task.debug(func+"new element to exchange at["+el_ind+"] ready");
		dom_update.call(this, el_ind, tmp_node.firstChild);
	}
	/*
	 * purpose: to update element at browser dom
	 * context: Container
	 */
	function dom_update(el_ind, new_el) {
		var func = "dom_update(): ";
		var parent_element = glob.document.querySelector(this.head);
		if (!parent_element) {
			this.task.error(func+"container parent is not in dom: "+this.head+">"); 
			return;
		}
		var childrens = parent_element.children.length;
		/* this is a key logic for all containers except 'single'
		 * index to be processed is allowed to be equal or +1 from last child index
		 * in case the index is 1 more only append is allowed - TODO
		 */
		if (("single" !== this.type) && (el_ind > childrens)) {
			this.task.error(func+"element index is to high ="+el_ind+": there is no child to update, childrens ="+childrens);
			return;
		}
		// TODO single is another
		if ("single" === this.type) {
			el_ind = 0;
		}
		if ("table" === this.type) {
			++el_ind;
		}
		if (el_ind === childrens) {
			parent_element.appendChild(new_el);
			this.task.result = func+" new element appended at "+el_ind;
		} else {
			parent_element.replaceChild(new_el, parent_element.children[el_ind]);
			this.task.result = func+" new element replaced at "+el_ind;
		}
	}
	/*
	 * purpose: to be called once container is in DOM to start element add
	 */
	function add_to_parent(bool) {
		var func = "parent_ready(): ";
		if (this.parent_ready_bool) {
			this.task.error(func+"is called twice");
			return;
		}
		this.parent_ready_bool = bool;
		if (!this.parent_ready_bool) {
			this.task.error(func+"is called with false argument");
			return;
		}
		this.task.debug("loaded ="+JSON.stringify(this.loaded));
		var parent_element = glob.document.querySelector(this.head);
		if (!parent_element) {
			this.task.error(func+"parent is not in dom: "+this.head+">"); 
			return;
		}
		// TODO single is another
		create_children.call(this, parent_element);
	}
	/*
	 * purpose: to create children from allready loaded or empty to be updated later
	 * context: Container
	 */
	function create_children(parent_element) {
		var func = "create_children(): ";
		// get the number of elements to be created
		var child_elems = (this.elem_names.length > this.loaded.length) ? this.elem_names.length : this.loaded.length;
		if ("single" === this.type) {
			child_elems = 1;
		}
		// create empty elements to be changed on update
		for (var i = 0; i < child_elems; ++i) {
			if (this.loaded[i]) {
				show.call(this, i);
			} else {
				if ("table" === this.type) {
					parent_element.appendChild(glob.document.createElement("tr"));
				} else {
					parent_element.appendChild(glob.document.createElement("div"));
				}
			}
		}
		this.task.result = this.name+": children.length = "+parent_element.children.length;
/*
		if (child_elems !== prnt.children.length) {
			this.task.error(func+" [FAIL]: unable to create "+child_elems+" child elements");
		}
*/
	}
	/*
	 * purpose: to check element dependencies
	 * context: Container
	 */
	function elem_is_not_valid(elem) {
		var func = "check_elem_dependecies_fail(): ";
		if (!elem.name) {
			this.task.error(func+"elem.name is not valid ="+elem.name+";");
			return true;
		}
		return false;
	}
	function test() {
		var success = 255;
		return success;
	}
})(window);
;(function(glob) {
	"use strict";
	// early exit
	if (!glob.app || !glob.app.core) return;
	
	// define static data
	var module_data = [
		"ui_element",
		["log", "net"],
		UI_element,
		test
	];
	// create app resources
	var ui_path = "ui/";
	var ui_ext = ".html";

	// load module consrtuctor to app
	var core = glob.app.core;
	var log = new core.Logger("element");
	core.core_loader.module = module_data;

	/*
	* purpose: provides interfaces(tasks) common for all ui elements
	*/
	function UI_element() {
		this.name = "ui_element";
		this.global_id = "ui_element>model"

		this.create = core.task.create(["create", create_element]);
	}
	/*
	* purpose: to create new ui element instance
	*/
	function create_element([model_data, name, config_string]) 
	{
		var func = "create_element(): ";
		// error exit
		if (this.task.string_is_not_valid(func, "model_data", model_data)) return;
		if (this.task.string_is_not_valid(func, "name", name)) return;
		if (this.task.string_is_not_valid(func, "config_string", config_string)) return;

		var new_element = new Element(model_data, name);

		// initialize element from string
		this.task.run_sync("object", new_element, "parse_config_string", config_string);

		// inform appropriate model that element is ready to insert model data
		this.task.run_async("model", new_element.model.name, "ui_ready", new_element);
	}
	/*
	 * purpose: to create new Element
	 * arguments: string, string
	 */
	function Element(model_data, name)
	{
		log.info = "Element(): new, data = "+JSON.stringify(arguments)+";";

		this.name = model_data.split(">").join("")+"_"+name;	// unique name
		this.model = new Model(model_data);
		// TODO possible dupliation with name
		this.global_id = "Element>"+this.name;
		this.log = new core.log.Model(["element", this.name]);

		this.parent_container = "";
		this.roles = [];

		this.html = [];
		this.attrs = {};
		this.actions = {};

		this.containers = [];

		this.ui_path = ui_path+this.model.name+"/"+this.name+ui_ext;

		this.parse_config_string = core.task.create(["parse_config_string", parse_config_string]);
		this.update = core.task.create(["update", update_element]);
		this.update_html = core.task.create(["update_html", update_html]);

		this.show = true;
		// TODO
		Object.defineProperty(this, "action", {
			set: function(d) { 
				(undefined === this.actions[d[0]])
					? this.log.error = "Element(): {actions}: attempt to update undefined action ="+JSON.stringify(d)
					: this.actions[d[0]].update(d);
			},
			get: function() {return true; }
		});
		Object.defineProperty(this, "attr", {
			set: function(d) { 
				(undefined === this.attrs[d[0]])
					? this.log.error = "Element(): {actions}: attempt to update undefined action ="+JSON.stringify(d)
					: this.attrs[d[0]].update(d);
			},
			get: function() {return true; }
		});
	}
	/*
	 * purpose: to update element on data change
	 * context: Element
	 */
	function update_element()
	{
		var func = "update_element(): ";
		if (element_not_valid(func, this)) return;
		//this.task.run_sync("object", this, "update_html");
		update_html.call(this);
		this.task.run_async("core", "ui_container", "update_container", this);
		this.task.result = func+"html updated";
	}
	/*
	 * purpose: to validate element
	 * context: no
	 */
	function element_not_valid(func, elem) {
		if (!elem || !elem.parent_container) {
			elem.task.error(func+"element is not valid;");
			return true;
		}
		return false;
	}
	function Attribute(attr_data_arr) {
		log.info = "Attribute(): new ="+JSON.stringify(attr_data_arr)+";";

		this.name = attr_data_arr[0];
		this.data = attr_data_arr[1];
		this.ind = attr_data_arr[2];
		
		this.update = function(data_arr) {
			log.info = "Attribute(): \""+this.name+"\" update(): data_arr ="+JSON.stringify(data_arr);
			this.data = data_arr[1];
		}
	}
	function Action(action_data_arr) {
		log.info = "Action(): new ="+JSON.stringify(action_data_arr)+";";

		this.name = action_data_arr[0];
		this.data = action_data_arr[1];
		this.ind = action_data_arr[2];
		
		this.update = function(data_arr) {
			log.info = "Action(): \""+this.name+"\" update(): data_arr ="+JSON.stringify(data_arr);
			this.data = data_arr[1];
		}
	}
	function Model(model_data) {
		log.info = "Model(): new ="+JSON.stringify(model_data)+";";
		if ((undefined === model_data) || (typeof model_data !== "string")) {
			log.error = "Model(): <model_data> is not valid: "+model_data;
			return;
		}
		var data_array = model_data.split(">");
		this.name = data_array[0];
		this.id = (2 === data_array.length) ? data_array[1] : "model";
	}
	function parse_config_string(data) {
		var func = "parse_config_string(): ";
		if (this.task.string_is_not_valid(func, "config_string", data)) return;

		var arr = data.split("|");
		// parse data to create template
		if (!this || !(this instanceof Element)) {
			this.task.error(func+"context is not valid ="+this+";");
			return;
		}
		if (3 > arr.length) {
			this.task.error(func+"data arr.length is not valid(less than 3) ="+arr.length+";");
			return;
		}
		// main parser
		for (var i =0; i < arr.length; ++i) {
			if (0 === i) {
				this.parent_container = arr[i];
				this.html.push(null);
				continue;
			}
			if (1 === i) {
				this.roles = arr[i].split(",");
				this.html.push(null);
				continue;
			} 
			switch (arr[i][0]) {
				case "@":	// data
					var attr = arr[i].slice(1);
/*
					if (!this.attrs[attr]) {
						this.attrs[attr] = {};
						this.attrs[attr].data = null;
					}
					this.attrs[attr].ind = i;
*/
					this.attrs[attr] = new Attribute([attr, null, i]);
					this.html.push(null);
					break;
				case "#":	// action
					var action_name = arr[i].slice(1);
					this.actions[action_name] = new Action([action_name, null, i]);
					this.html.push(null);
					break;
				case "$": 	// container
					// split container and children
					var data_arr = arr[i].slice(1).split(":");
					// get children if any
					var children = [];
					if (1 < data_arr.length) {
						children = data_arr[1].split(",");
					}
					var cont_data = data_arr[0].split(">");
					if (2 !== cont_data.length) {
						this.task.error(func+"wrong container data provided ="+data_arr[0]);
						break;
					}
					var name = cont_data[0];
					var type = cont_data[1];

					if (this.containers[name]) {
						this.task.error(func+"double container \""+name+"\" initialization");
						break;
					}
					this.containers.push(name);
					this.task.run_async("core", "ui_container", "create", [name, type, children]);
					this.html.push(null);
					break;
				default:
					this.html.push(arr[i]);
			}
		}
		//this.task.debug(func+"html: "+this.html+", attrs: "+this.attrs+", actions: "+JSON.stringify(this.actions));
	}
	/*
	 * purpose: to create html valid string from ui_element
	 * context: Element
	 */
	function update_html() {
		var func = "html_from_ui_element(): ";
		if (this.attrs) {
			var attr_names = Object.keys(this.attrs);
			for (var i = 0; i < attr_names.length; ++i) {
				var attr = this.attrs[attr_names[i]];
				if (attr.data) {
					this.html[attr.ind] = attr.data;
				}
			}
		}
		if (this.actions) {
			var action_names = Object.keys(this.actions);
			for (var i = 0; i < action_names.length; ++i) {
				var new_action = this.actions[action_names[i]];
				if (new_action.data) {
					this.html[new_action.ind] = new_action.data;
				}
			};
		}
		var result = this.html.join("");
		this.task.debug(func+" RESULT: "+result);
	}
	function test() {
		var success = 255;
		return success;
	}
})(window);
;(function(glob) {
	"use strict";
	// early exit
	if (!glob.app || !glob.app.core) return;
	
	var module_data = [
		"err", 				// name
		[],		// core dependencies
		Err,				// constructor
		test				// self test
	];

	var internals = [];
	var tests = [];

	// load module consrtuctor to app
	var core = glob.app.core;
	core.core_loader.module = module_data;

	function Err() {
		Object.defineProperty(this, "internal", {
			set: function(message) {
				internals.push(message);
			},
			get: function() { return internals;}
		});
		Object.defineProperty(this, "test", {
			set: function(message) {
				tests.push(message);
			},
			get: function() {return tests;}
		});
	}
	function test() {
		// success return
		return 1;
	}
})(window);
;(function(glob) {
	"use strict";
	// early exit
	if (!glob.app || !glob.app.core) return;

	// define static data
	var module_data = [
		"log",
		["err", "tst"],
		Log,
		test
	];
	//var mock = {run: false};
	var models_to_debug = ["element", "container"];
	var instances_to_debug = [""];
	var debug_errors = true;
	var model_debug = [];
	var core = glob.app.core;

	// create module resources

	// load module consrtuctor to app
	core.core_loader.module = module_data;

	// module constructor to be called by core
	function Log() {
		this.Model = Model_logger;
	}
	function Model_logger([model, instance]) {
		// storage
		var error_log = [];
		var info_log = [];
		var warn_log = [];
		// headers data
		var model_name = model.toUpperCase();
		var instance_name = instance;
		var headers = [model_name, instance_name];
		// debug flag
		var debug_model = (-1 !== models_to_debug.indexOf(model)) ? true : false;
		var debug_instance = (-1 !== instances_to_debug.indexOf(instance)) ? true : false;
		// interface
		Object.defineProperty(this, "error", {
			set: function(data) {
				var message = create_message("ERROR", headers, data);
				error_log.push(message);
				if (debug_errors) {
					console.log(message);
				}
			},
			get: function() {
				if (0 === error_log.length) {
					var message = create_message("LOG", headers, "ERROR: empty");
					console.log(message);
					return;
				}
				for (var i = 0; i < error_log.length; ++i) {
					console.log(error_log[i]);
				}
			}
		});
		Object.defineProperty(this, "warn", {
			set: function(data) {
				var message = create_message("WARN", headers, data);
				warn_log.push(message);
				//if (-1 !== debug || "off" !== core_debug[0]) {
				if (debug_model || debug_instance) {
					console.log(message);
				}
			},
			get: function() {
				if (0 === error_log.length) {
					var message = create_message("LOG", headers, "WARN: empty");
					return;
				}
				for (var i = 0; i < error_log.length; ++i) {
					console.log(error_log[i]);
				}
			}
		});
		Object.defineProperty(this, "info", {
			set: function(data) {
				var message = create_message("INFO", headers, data);
				info_log.push(message);
				//if (-1 !== debug || "all" === core_debug[0]) {
				if (debug_model && debug_instance) {
					console.log(message);
				}
			},
			get: function() {
				if (0 === info_log.length) {
					var message = create_message("LOG", headers, "INFO: empty");
					return;
				}
				for (var i = 0; i < info_log.length; ++i) {
					console.log(info_log[i]);
				}
			}
		});
	}
	function create_message(type, headers, data) {
		// TODO refactor to store time here and possibly move other appends to 'get'
		var string = "["+type+"]: <"+headers[0]+">: {"+headers[1]+"}: " + data+";";
		return string;
	}
/*
	function Logger(name) {
		var error_log = [];
		var info_log = [];
		var module_name = name.toUpperCase();
		Object.defineProperty(this, "error", {
			set: function(data) {
				var message = "[ERROR]: <"+module_name+">: " + data;
				error_log.push(message);
			},
			get: function() {
				if (0 === error_log.length) {
					console.log("[INFO]: <"+module_name+">: error_log is empty");
					return;
				}
				for (var i = 0; i < error_log.length; ++i) {
					console.log(error_log[i]);
				}
			}
		});
		Object.defineProperty(this, "info", {
			set: function(data) {
				var message = "[INFO]: <"+module_name+">: " + data;
				info_log.push(message);
			},
			get: function() {
				for (var i = 0; i < info_log.length; ++i) {
					console.log(info_log[i]);
				}
			}
		});
	}
*/

	// TODO move test common functionality to tst module
	function test() {
		var success = 255;
/*
		mock.run = true;
		success = info_test(["module_one", "test message"]);
		success = info_test(["", ""]);
		success = info_test([null, "some message"]);
		mock.run = false;
		// TODO unsuccess cases
*/
		return success;
	}
/*
	function info_test(message) {
		if (!Array.isArray(message) || message.length < 2) {
			core.err.test = "[ERROR]: console_test: message is "+ message;
			return;
		}
		// init mock data
		var success_message = "[" + message[0] + "]: " + message[1];
		if (mock.log === undefined) {
			Object.defineProperty(mock, "log", {
				set: function(message) {
					this.result = message;
				},
				get: function() { return null;}
			});
		}
		// perform test
		core.log.info = message;
		// check result
		if (success_message === mock.result) {
			// TODO pass some data to tst about test
			return 0;
		} else {
			core.err.test = "[FAIL]: <log>: info_test: expected = "+success_message+"; current = "+ mock.result;
			return 1;
		}
	}
*/
})(window);
;(function(glob) {
	"use strict";
	// early exit
	if (!glob.app || !glob.app.core) return;
	
	// define static data
	var module_data = [
		"model",	// name
		["log", "task"],		// dependencies
		Model_init,		// constructor
		test		// test function
	];

	var core = glob.app.core;
	var log = new core.Logger("core-model");
	core.core_loader.module = module_data;
	function Model_init() {
		this.Model = Model;
	}
	/*
	 * purpose: to provide common for all data models interfaces and services
	 * context: new object with id and name fields already set
	 */
	function Model() {
		var func = "Model(): ";
		if (!this.name || typeof this.name !== "string") {
			log.error = func+ "wrong \"name\" data provided: this.name ="+this.name+";"; 	// task error
			return;
		}
		if (!this.id || typeof this.id !== 'string') {
			log.error = func+ "wrong \"id\" data provided: this.id ="+this.id+";"; 	// task error
			return;
		}

		this.log = new core.log.Model([this.name, this.id]);	// sub task ???
		this.global_id = this.name+">"+this.id;

		this.ui = {};
		this.ui_config;
		this.actions;
		this.attrs = {};

		// common for all models interface
		this.set_ui = core.task.create(["set_ui", set_ui]);

		// only model model interface
		if ("model" === this.id) {
			this.instances = {};
			this.clean_up = core.task.create(["clean_up", clean_up]);
			this.init = core.task.create(["init", init_model]);
			this.ui_ready = core.task.create(["ui_ready", set_model_ui]);
		}

		// to be implemented in real model
		this.get_model_data = function() {
			return [];
		}
		this.get_model_config_data = function() {
			return {};
		}
		this.get_config_data = function() {
			return {};
		}
		this.Instance = function(data) {
			this.name = "default model";
		}
	}
	function clean_up() {
		this.instances = {};
		this.ui = {};
	}

	function init_model(user) {
		var func = "init_model(): ";
		//this.log.info = func+"user \""+user.name+"\" data initializion ="+JSON.stringify(user)+";";
		this.task.debug(func+"user \""+user.name+"\" data initializion ="+JSON.stringify(user)+";");
		
		// init model static data

		// init model ui
		var config = this.get_config_data(user);
		this.actions = config.actions;
		this.ui_config = config.ui;

		// get projects data and init models
		var model_data = this.get_model_data(user);
		var model_config = this.get_model_config_data(user);
		for (var i = 0; i < model_data.length; ++i) {
			this.instances[model_data[i][0]] = new this.Instance(model_data[i], model_config);
			this.task.run_async("core", "ui", "model", [this.instances[model_data[i][0]].global_id, this.instances[model_data[i][0]].ui_config]);
		}
			
		if (this.ui_config) {
			this.task.run_async("core", "ui", "model", [this.name, this.ui_config]);
		}
	}

	/*
	 * purpose: to add new element to model instance
	 */
	function set_model_ui(element) {
		var func = "set_model_ui(): ";
		if (!element) {
			this.task.debug(func+"element <"+element+"> is not valid;");
		}
		//if (undefined !== element.model.id && null !== element.model.id) {		
		if ("model" === element.model.id) {		
			this.task.run_async("object", this, "set_ui", element);
		} else {
			// set ui data 
			if (!this.instances[element.model.id]) {
				this.task.error(func+"no instance \""+element.model.id+"\" for element ="+JSON.stringify(element)+";");
				return;
			}
			this.task.run_async("object", this.instances[element.model.id], "set_ui", element);
		}
	}
	/*
	 * purpose: to set ui element with actions and attributes
	 * context: Model
	 */
	function set_ui(el) {
		var func = "set_ui(): ";
		// TODO update element naming
		var name = el.name.split("_").slice(1).join("_");
		this.ui[name] = el;
		var incode_id = "var id='"+this.id+"';";
		// update actions
		if (this.actions[name] && (0 < this.actions[name].length)) {
			for (var i = 0; i < this.actions[name].length; ++i) {
				var new_action = this.actions[name][i].slice();
				new_action[1] = incode_id+new_action[1];
				this.ui[name].action = new_action;
				this.task.debug(func+"ui["+name+"] action <"+new_action+"> created");
			}
		}
		// update attributes
		var attr_names = Object.keys(this.ui[name].attrs);
		for (var i = 0; i < attr_names.length; ++i) {
			var attr_name = attr_names[i];
			this.ui[name].attr = [attr_name, this.attrs[attr_name]];	
		}
		
		this.task.run_async("object", this.ui[name], "update");
	}

	function test() {
		return 255;
	}
	
})(window);
;(function(glob) {
	"use strict";
	// early exit
	if (!glob.app || !glob.app.core) return;

	var module_data = [
		"net",
		["log", "tst", "task"],
		Net,
		test
	];

	// load module consrtuctor to app
	var core = glob.app.core;
	core.core_loader.module = module_data;
	var log = new core.Logger("net");

	function Net() {
		this.global_id = "net>model";

		this.req_get = core.task.create(["req_get", get_req]);
		this.req_post = core.task.create(["req_post", post_req]);
	}

	function get_req([uri, handler]) {
		this.task.debug("get_req(): uri = "+uri+", handler is "+handler+";");
		send_request.bind(this)("GET", uri, handler, null);
	}

	function post_req([uri, handler, data]) {
		this.task.debug("post_req(): uri = "+uri+", handler is "+handler+", data = "+data+";");
		send_request.bind(this)("POST", uri, handler, data);
	}
	function send_request(method, uri, handler, data) {
	    var req;
	    if (glob.XMLHttpRequest) {
	        req = new XMLHttpRequest();
	    }
	    else if (glob.ActiveXObject) {
	        req = new ActiveXObject("Microsoft.XMLHTTP");
	    }

	    if (!req) {
			this.task.error("send_request(): req is invalid ="+req+";");
			return;
		}

	    req.open(method, uri);
		data ? req.send(data) : req.send();

	    req.onreadystatechange = (function() {
	        if (req.readyState === XMLHttpRequest.DONE) {
	            if (req.status === 200) {
					this.task.debug("send_request(): success; req.response is ="+req.responseText+";");
	                handler(req.responseText);
	            } else {
					this.task.error("send_request(): req.onreadystatechange req.status is "+req.status+", uri ="+uri+";");
					return;
	            }
	        }
	    }).bind(this);
	}
	function test() {
		return 255;
	}
})(window);
;(function(glob) {

	"use strict";
	// early exit
	if (!glob.app || !glob.app.core) return;
	
	// define static data
	var module_data = [
		"task",
		["log"],
		Task_module,
		test
	];
	// create app resources
	var tasks = {};

	// load module consrtuctor to app
	var core = glob.app.core;
	var log = new core.Logger("core-task");
	core.core_loader.module = module_data;

	// module constructor
	function Task_module() {
		this.log = log;
	}
	function Task(id, name) {
		this.id = id+"@"+name; 		// unique task identifier, human readable and meaningfull
		this.p_task = [];	 		// parent task id's storage
		this.name = name;			// interface name
		this.debug_log = [];		// to store debug output from jobs(module/model functions)
		this.state = "run";			// 'run', 'error', 'ok', 'done'
		this.result = "";
	};
	/*
	* purpose: to create model instance interface, to be executed 'inside' the
	* ->new Task. All Task functionality will be gained to interface method to
	* ->perform debugging, error handling and subtask execution
	*/
	Task_module.prototype.create = function([interface_name, method]) {
		//log.info = "create(): interface_data: ["+interface_name+"];";
		return function(data, parent_task) { 	// task run function
			var func = "run(): ";
			if (this.task && !(this.task instanceof Task)) {
				log.error = func+"\""+this.name+".task\" is not valid; this is generic property and should not be defined;";
				return;
			}
			// one task per module allowed, avoid multiple tasks
			if (this.task && this.task instanceof Task && "run" === this.task.state) {
				//log.error = func+"\""+this.global_id+".task{"+this.task.name+"}\" is already running: "+JSON.stringify(this.task)+";";
				log.error = func+"\""+this.global_id+".task{"+this.task.name+"}\" is already running, p_task =\""+parent_task+"; interface =\""+interface_name+"\";";
				return;
			}
			// create in-module task data storage to avoid suppling it throw arguments later
			this.task = new Task(this.global_id, interface_name);
			if (parent_task && (parent_task instanceof Task)) {
				while (parent_task.p_task.length) {
					this.task.p_task.push(parent_task.p_task.shift());
				}
				this.task.p_task.push(parent_task.id);
				while (parent_task.length) {
					this.task.debug_log.push(parent_task.debug_log.shift());
				}
			}
			// debug input data
			this.task.debug("[RUN]: {"+this.task.name+"}: data ="+JSON.stringify(data, task_filter)+";");
			method.call(this, data);
			check_task_result(this.task);
		};
	};
	/*
	* purpose: to run subtask in sync manner, which means that subtask execution
	* ->will procedd immediately and current task will wait until subtask ends
	*/
	Task.prototype.run_sync = function(type, module, task_name, data) {
		// early exit
		if (subtask_is_not_valid.call(this, type, module, task_name)) return;

		switch (type) {
			case "object":
				module[task_name](data, this);
				break;
			case "core":
				core[module][task_name](data, this);
				break;
			case "model":
				glob.app[module][task_name](data, this);
				break;
		}
	};
	/*
	* purpose: to run subtask in async manner, which means that subtask execution
	* ->will be suspended until current task ends
	*/
	Task.prototype.run_async = function(type, module, task_name, data) {
		// early exit
		if (subtask_is_not_valid.call(this, type, module, task_name)) return;

		switch (type) {
			case "object":
				glob.setTimeout(module[task_name].bind(module), 0, data, this);
				break;
			case "core":
				glob.setTimeout(core[module][task_name].bind(core[module]), 0, data, this);
				break;
			case "model":
				glob.setTimeout(glob.app[module][task_name].bind(glob.app[module]), 0, data, this);
				break;
		}
	};
	/*
	* purpose: to validate string and set error message in case string is invalid
	*/
	Task.prototype.string_is_not_valid = function(func, var_name, string) {
		if (!string || !("string" === typeof string) || (1 > string.length)) {
			this.error(func+var_name+" is not valid ="+JSON.stringify(string)+";");
			return true;
		}
		return false;
	}
	/*
	* purpose: to store debug data and output it in error case
	*/
	Task.prototype.debug = function(string) {
		var header = Date.now()+" [DEBUG]: task ="+this.id+": ";
		var message = header + string;
		this.debug_log.push(message);
	}
	/*
	* purpose: to store error data and mark state as error ot be handled by result
	*/
	Task.prototype.error = function(string) {
		var header = Date.now()+" [ERROR]: task ="+this.id+": ";
		var message = header + string;
		this.debug_log.push(message);
		this.state = "error";
	}
	// service functions

	/*
	* purpose: to output success message
	* context: no
	* arguments: Task
	*/
	function success(task) {
		var parent_task_name = task.p_task.join("->");
		log.info = "["+parent_task_name+"]: {"+task.id+"}: "+task.result+": [OK];";
	}
	/*
	* purpose: to handle task results and mark state as "done" to let new task be started
	* context: no
	* arguments: Task
	*/
	function check_task_result(task) {
		switch(task.state) {
			case "run":
				// no error was reported, print ok
				task.state = "ok";
				success(task);
				break;
			case "error":
				// print error
				for (var i = 0; i < task.debug_log.length; ++i) {
					console.log(task.debug_log[i]);
				}
				break;
			default:
				// uknown or undefined state, error
				log.error = "check_task_result(): uknown task state ="+task.state+";";
				break;
		}
		task.state = "done";
	}
	/*
	* purpose: to validate subtask
	* context: Task
	* return: false in case no errors found, true overwise
	*/
	function subtask_is_not_valid(type, module, task_name) {
		var message = "subtask_is_not_valid(): ["+this.id+"]: ERROR: ";
		var prnt;
		// validate type
		if ("core" === type) {
			prnt = core[module];
			message = message + "\"core."+module+"\"";
		} else if ("model" === type) {
			prnt = glob.app[module];
			message = message + "\"glob.app."+module+"\"";
		} else if ("object" === type) {
			prnt = module;
			message = message + "\""+module+"\"";
		} else {
			this.error(message+"type <"+type+"> is not valid");
			return true;
		}
		// validate module
		if ((undefined === prnt) || (null === prnt)) {
			this.error(message+" is not valid ="+prnt+";");
			return true;
		}
		// validate task
		if (undefined === prnt[task_name] || null === prnt[task_name] || !(prnt[task_name] instanceof Function)) {
			this.error(message+"."+task_name+"\" is not valid ="+prnt[task_name]+";");
			return true;
		}
		return false;
	}
	/*
	 * purpose: to use in JSON.stringify to avoid double task print
	 */
	function task_filter(key, value) {
		if (value instanceof Task) {
			return value.id;
		}
		return value;
	}

	function test() {
		return 255;
	}
})(window);
;(function(glob) {
	"use strict";
	// early exit
	if (!glob.app || !glob.app.core) return;

	var module_data = [
		"tst",
		["err"],
		Tst,
		test
	];

	var mock = {};
	var errors = [];

	// load module consrtuctor to app
	var core = glob.app.core;
	core.core_loader.module = module_data;

	function Tst() {
		this.modules_test = modules_test;
		Object.defineProperty(this, "error", {
			set: error_add,
			get: function() {return errors}
		});
	}
	function error_add(error) {
		errors.push(error);
		core.log.info = ["tst", "[ERROR]: <"+error.module+">: ("+error.func+"): "+error.scope+"; result = "+JSON.stringify(error.result)];
	}
	function test() {
		// success return
		return 1;
	}
	function modules_test(modules) {
		var counter = 0;
		var success_counter = 0;
		modules.forEach(function(val, ind, arr) {
			counter++;
			success_counter += app[val].self_test();
		});
		if (counter === success_counter) {
			core.log.info = ["tst", "all tests passed"];
		} else {
			// TODO report errors by modules, suites and cases
			console.log("[ERROR]: tst: %s not passed", counter - success_counter);
		}
	}

})(window);
;(function(glob) {
	"use strict";
	// early exit
	if (!glob.app || !glob.app.core) return;

	// define static data
	var module_data = [
		"ui",
		["log", "ui_element", "ui_container", "task"],
		UI,
		test
	];

	// templates related data
	var ui_path = "ui/";
	var ui_ext = ".html";
	var template_names = [];
	var template_storage = [];
	var template_queue = {};
	// load module consrtuctor to app
	var core = glob.app.core;
	var log = new core.Logger("ui");
	core.core_loader.module = module_data;

	// create module resources

	// module constructor
	function UI() {
		this.name = "ui";
		this.global_id = "ui>model";

		//this.update = core.task.create(["update", update_element]);
		this.model = core.task.create(["model", set_model]);

		//this.in_dom = core.task.create(["in_dom", elem_dom_added]);
		//this.dom_queue = core.task.create(["dom_queue", push_to_dom_queue]);
		this.clean_up = core.task.create(["clean_up", clean_up]);
		//this.ui = ui;

		this.get_t = function() {
			for (var i=0; i < template_names.length; ++i) {
				console.log(i+">"+template_names[i]+"\n"+template_storage[i]+"\n\n");
			}
		}
	}
	/*
	 * purpose: to clean_up all data stored, except templates
	 */
	function clean_up() {
		this.task.run_sync("core", "ui_container", "clean_up");
		glob.document.body.innerHTML = "";
	}
	/*
	 * purpose:
	 */
	function set_model([model_data, ui_names]) {
		var func = "set_model(): ";
		var m_arr = model_data.split(">");
		var model = m_arr.shift();

		// invalid ui_model, exit
		if (undefined === ui_names || 0 === ui_names.length) {
			this.task.error(func+"invalid ui_model");
			return;
		}

		// create elements
		for (var i =0; i < ui_names.length; ++i) {
			// load ui model templates
			var el_id = model_data.split(">").shift()+"_"+ui_names[i];
			var el_name = ui_names[i];
			var el_path = ui_path+model+"/"+el_name+ui_ext;
			var el_ind = template_names.indexOf(el_id);
			if (-1 === el_ind) {
				// early exit if template was already requested
				if (template_queue.hasOwnProperty(el_id)) {
					template_queue[el_id].push([model_data, el_name]);
					this.task.debug(func+"element \""+el_id+"\" in template_queue");
					continue;
				}
				template_queue[el_id] = [];
				this.task.debug(func+"element \""+el_id+"\" template requested");
				this.task.run_async("core", "net", "req_get", [el_path, get_template_handler(model_data, el_name).bind(this)]);
				continue;
			}
			if (!template_storage[el_ind]) {
				this.task.error(func+"template storage for element \""+el_id+"\" is empty;");
				return;
			}
			var el_data = template_storage[el_ind];
			this.task.debug(func+"new model <"+model+"> element \""+el_id);
			this.task.run_async("core", "ui_element", "create", [model_data, el_name, el_data]);
		}
	}
	function get_template_handler(model_data, el_name) {
		return function(data) {
			var func = "template_handler(): ";
			var el_id = model_data.split(">").shift()+"_"+el_name;
			var ind = template_storage.push(data) -1;
			if (0 > ind) {
				this.task.error(func+" template_storage index is "+ind+";");
				return;
			}
			template_names[ind] = el_id;

			this.task.run_sync("core", "ui_element", "create", [model_data, el_name, data]);

			if (template_queue[el_id] && 0 < template_queue[el_id].length) {
				for (var i = 0; i < template_queue[el_id].length; ++i) {
					this.task.run_sync("core", "ui_element", "create", [template_queue[el_id][i][0], template_queue[el_id][i][1], data]);
				}
			}
		}
	}
	function test() {
		return 255;
	}
})(window);
;(function(glob) {
	"use strict";
	// early exit
	if (!glob.app || !glob.app.core) return;
	
	// define static data
	var module_data = [
		"user",
		["log", "ui", "task"],
		User,
		test
	];
	// create app resources
	var roles = {
		guest: {
			ui: ["guest_body", "header", "main", "footer", "login"],
			actions: {
				login: ["login", "app.core.user.login([u_name.value, u_pass.value]);return false"]
			},
			models: ["user", "app"]
		},
		manager: {
			ui: ["header", "main", "footer", "menu"],
			actions: {
				menu: ["logout", "app.core.user.logout()"]
			},
			models: ["app", "user", "project"]
		},
		admin: {
			ui: ["admin_body", "dash_main", "menu", "dash_header", "user_menu_entry", "user_dash_main"],
			actions: {
				menu: ["logout", "app.core.user.logout()"],
                user_menu_entry: ["show", "app.user.show();"]
			},
			models: ["user", "project", "app"]
		}
	};
	var users = {
		vasil: {
			name: "vasil",
			role: "admin",
			passw: "123"
		},
		std: {
			name: "guest",
			role: "guest",
			passw: ""
		}
	};
	var current_user = {
		name: users.std.name,
		role: roles[users.std.role],
		role_name: users.std.role
	};
	// load module consrtuctor to app
	var core = glob.app.core;
	var log = new core.Logger("core-user");
	core.core_loader.module = module_data;

	// module constructor
	function User() {
		this.name = "user";
		this.id = "core";
		this.global_id = this.name+">"+this.id;

		this.login = core.task.create(["login", login]);
		this.logout = core.task.create(["logout", logout]);
	}
	function logout() {
		this.task.run_async("core", "user", "login", ["std", ""]);
	}
	function login(data) {
		var func = "login(): ";
		this.task.debug(func+"data ="+JSON.stringify(data));

		if (!data || !Array.isArray(data) || 2 > data.length) {
			var data = ["std", ""];
		}
		get_user.call(this, data);
	}
	function get_user([name, passw]) {
		var func = "get_user(): ";
		this.task.debug(func+"name ="+name+" , pass ="+passw);
		var user_names = Object.keys(users);
		if (-1 === user_names.indexOf(name)) {
			this.task.error(func+"user \""+name+"\" does not exist");
			return;
		}
		var new_user = users[name];
		var role_names = Object.keys(roles);
		if (-1 === role_names.indexOf(new_user.role)) {
			this.task.error(func+"role \""+new_user.role+"\" does not exist");
			return;
		}
		// check passw
		if (passw !== new_user.passw) {
			this.task.error(func+"passw \""+passw+"\" is not correct");
			return;
		}
		init_new_user.call(this, new_user);
	}
	function init_new_user(new_user) {
		// set user as current
		current_user.name = new_user.name;
		current_user.role = roles[new_user.role];
		current_user.role_name = new_user.role;

		// clean up
		for (var i =0; i < current_user.role.models.length; ++i) {
			var model_name = current_user.role.models[i];
			this.task.run_sync("model", model_name, "clean_up", null);
		}
		this.task.run_sync("core", "ui", "clean_up", null);

		// init data models
		for (var i = 0; i < current_user.role.models.length; ++i) {
			var model_name = current_user.role.models[i];
			this.task.run_async("model", model_name, "init", current_user);
		}
	}
	function test() {
		return 255;
	}
})(window);
;(function(glob) {
	"use strict";
	// early exit
	if (!glob.app || !glob.app.core) return;

	var module_data = [
		"util",
		["log"],
		Util,
		test
	];

	// load module consrtuctor to app
	var core = glob.app.core;
	core.core_loader.module = module_data;
	var log = new core.Logger("util");

	function Util() {
		this.global_id = "util>model";

		this.check_string_fail = core.task.create(["check_string_fail", check_string_fail]);
	}
	function string_not_valid(string) {

	}
	function check_string_fail(task, variable, var_name, check_len) {
		var length = (check_len) ? check_len : 0;
		if (!variable || !("string" === typeof variable) || (length < config_string.length)) {
			// TODO too much data to be parsed, e.g. func name is absent
			return true;
		}
		return false;
	}

	function test() {
		// success return
		return 1;
	}
})(window);
