var game;

$(document).ready(function(){
	game = new game_controller();
	game.init('#game_container');
});


var ship_constructor = function(parent){
	this.parent = parent;
	this.dom_element = null;
	this.name = null;
	this.status = null;
	this.width;
	this.mid_width;
	this.height;
	this.mid_height;
	this.vectors = {x: 0, y: 0};
	this.stats_per_second = {
		turn_speed : 200,
		engine_power : 10,
		thrust_bleed : 3
	}
	this.vector_angle = 0;
	this.ship_angle = 0;
	this.offset_angle = 0;
	this.turn_speed = 5;
	this.engine_power = .5;
	this.max_speed = 30;
	this.thrust_on = false;
	this.heartbeat_interval = 30;
	this.thrust_value = 0;
	this.thrust_bleed = 2;
	this.turn_direction = 0;

	this.init = function(){
		var dom_element = this.create_dom_element();
		this.get_dom_size();
		this.update_stats_to_heartbeat();
		this.start_heartbeat();
		return dom_element;
	}
	this.set_name = function(name){
		this.name = name;
		console.log('name is now ',this.name);
	}
	this.get_name = function(){
		return this.name;
	}
	this.update_stats_to_heartbeat = function(){
		var intervals = 1000 / this.heartbeat_interval;
		for(var i in this.stats_per_second){
			this[i] = this.stats_per_second[i]/intervals;
		}
	}
	this.create_dom_element = function(){
		this.dom_element = $("<div>",
			{
				id: 'ship',
				class: 'ship_class'
			}
		);
		return this.dom_element;
	}
	this.set_position = function(x_or_xy_coord, y){
		var coord_obj = {};
		if(typeof x_or_xy_coord != 'object'){
			coord_obj = {
				left: x_or_xy_coord+'px',
				top: y+'px'
			}
		}
		else{
			coord_obj.left = x_or_xy_coord.x;
			coord_obj.top = x_or_xy_coord.y;
		}
		this.dom_element.css(coord_obj);
	}
	this.get_dom_size = function(){
		this.width = this.dom_element.width();
		this.height = this.dom_element.height();
		this.mid_width = this.width/2;
		this.mid_height = this.height/2;
		var output = {
			width: this.width,
			height: this.height,
			mid_width: this.mid_width,
			mid_height: this.mid_height
		}
		return output;
	}
	this.turn = function(direction){
		this.turn_direction = direction;
	}
	this.perform_turn = function(){
		if(this.turn_direction != 0){
			var new_angle = this.ship_angle+(this.turn_speed*this.turn_direction);
			this.dom_element.css({
				'transform' : 'rotateZ('+new_angle+'deg)'
			});
			this.ship_angle = new_angle;
		}
	}
	this.stop_turn = function(){
		this.turn_direction = 0;
	}
	this.get_radians = function(degrees){
		return (Math.PI/180) * degrees;
	}
	this.change_vector = function(){
		this.vectors.x -= Math.cos(this.get_radians(this.ship_angle+this.offset_angle)) * this.engine_power;
		this.vectors.y += Math.sin(this.get_radians(this.ship_angle+this.offset_angle)) * this.engine_power;
	}
	this.move_ship = function(){

		this.dom_element.css({
			top : '+='+this.vectors.x+'px',
			left : '+='+this.vectors.y+'px'
		});
		this.parent.ship_move_handler(this);	
	}
	this.thrust = function(){
		this.thrust_on =true;
	}
	this.stop_thrust = function(){
		this.thrust_on = false;
	}
	this.add_thrust = function(){
		if(this.thrust_value + this.engine_power > this.max_speed){
			this.change_vector();
		} else{
			this.change_vector();
		}
	}
	this.start_heartbeat = function(){
		if(this.heartbeat!=null){
			this.stop_heartbeat();
		}
		this.heartbeat = setInterval(this.perform_heartbeat.bind(this),this.heartbeat_interval);
	}
	this.stop_heartbeat = function(){
		if(this.heartbeat != null){
			clearInterval(this.heartbeat);
		}
	}
	this.thrust_reduce = function(){
		//console.log('thrust reduce called:'+this.thrust_value);

		if(this.thrust_value - this.thrust_bleed > 0){
			this.thrust_value -= this.thrust_bleed;
		} else {
			this.thrust_value = 0;
		}
	}
	this.perform_heartbeat = function(){
		if(this.thrust_on){
			this.add_thrust();
		} else {
			//this.thrust_reduce();
		}
		this.perform_turn();
		this.move_ship();
		
	}
	this.wrap_check = function(){

	}
	this.get_position = function(){
		return this.dom_element.position();
	}
	this.get_size = function(){
		var output = {
			width: this.width,
			height: this.height,
			mid_width: this.mid_width,
			mid_height: this.mid_height
		};
		return output;	
	}
	this.get_bounds = function(){
		var position = this.dom_element.position();
		var bounds = {
			left: position.left,
			top: position.top,
			bottom: position.top + this.height,
			right: position.left + this.width
		}
		return bounds;
	}
}


var game_controller = function(){
	var _this = this;
	this.shiba = 'inu';
	this.game_npc_mobiles = [];
	this.remote_player_mobiles = {};
	this.player_mobile;
	this.game_area = null;
	this.width;
	this.height;
	this.mid_width;
	this.mid_height;
	this.network = null;
	this.set_game_area = function(){
		this.width = this.game_area.width();
		this.height = this.game_area.height();
		this.mid_width = this.width/2;
		this.mid_height = this.height/2;
	}
	this.init = function(game_area_selector){
		console.log('moocow, javascript');
		this.game_area = $(game_area_selector);
		this.set_game_area();
		this.make_ship(true);  //make local player ship
		this.attach_body_event_handlers();
		this.network = new network_template();
		this.network.set_connection('localhost:8001');
		this.network.register_message_callback(this.receive_communication);
		this.network.socket_toggle(this.connect_to_server.bind(this));
		
	}
	this.set_player_name = function(){
		this.network.send_name(this.player_mobile.get_name());
	}
	this.move_ship = function(ship_x, ship_y, animated, ship){
		//if the ship is going to teleport to the spot, do this
		if(!animated){
			if(ship===undefined){
				this.player_mobile.set_position(ship_x, ship_y);	
			} else{
				ship.set_position(ship_x, ship_y);
			}
		}	
		//otherwise animate
		//TODO add animation
	}
	this.make_ship = function(is_local_player_ship,player_id){
		//make the ship's dom element
		var ship = new ship_constructor(this);
		if(is_local_player_ship){
			this.player_mobile = ship;
			var new_name = prompt("what is your name?");
			this.player_mobile.set_name(new_name);


		} else{
			ship.set_name(player_id);
		}
		var ship_dom_element = ship.init();
		
		//append the ship's dom element to the game area
		this.game_area.append(ship_dom_element);
		//get the ship's size so we can place it in the center of the game area
		var ship_physical_stats= ship.get_dom_size();
		//set the ship's position to the middle of the game are
		var ship_x = this.mid_width - ship_physical_stats.mid_width;
		var ship_y = this.mid_height - ship_physical_stats.mid_height;
		this.move_ship(ship_x, ship_y, false);
		return ship;
	}
	this.handle_keypress = function(e){
		//console.log('key press',this);
		var name = _this.player_mobile.get_name();
		switch(e.which){
			case 119: //thrust pressed
				//console.log('thrust pressed');
				_this.player_mobile.thrust();
				this.network.send_message(name,'thrust');
				break;
			case 100: //turn right
				//console.log('turn right pressed');
				//event "this" redeclaration workaround #1
				//_this.player_mobile.turn();
				//event "this" redeclaration workaround #2, see //REDEC WORKAROUND #2 for more details
				_this.player_mobile.turn(1);
				this.network.send_message(name,'turn_right');
				break;
			case 115: //brake pressed, not currently used
				//console.log('brake pressed');
				this.network.send_message(name,'brake');
				break;
			case 97: //turn left pressed
				//console.log('turn left pressed');
				_this.player_mobile.turn(-1);
				this.network.send_message(name,'turn_left');
				break;
			default:
				//console.log('something else pressed');
				break;

		}
	}
	this.handle_keyup = function(e){
		var name = _this.player_mobile.get_name();
		switch(e.which){
			case 87: //thrust pressed
				//console.log('thrust keyup',this.player_mobile);
				this.player_mobile.stop_thrust();
				this.network.send_message(name,'stop_thrust');
				break;
			case 65:
			case 68: 
				//console.log('turn keyup');
				this.player_mobile.stop_turn();
				this.network.send_message(name,'stop_turn');

			default:
				//console.log('something else keyup'+e.which);			
		}
	}
	this.receive_communication = function(message_whole){
		//return;
		var message_parsed = JSON.parse(message_whole);
		//console.log('RECEIVED******',message_parsed);

		if(message_parsed.type === 'history'){
			return;
		}
		
		var message_packet = message_parsed.data;
		//console.log('message packet: ',message_packet);
		var player_id = message_packet.author;
		var our_name = _this.player_mobile.get_name();
		if(our_name === message_packet.author){
			//console.log('received our own message... ignoring');
			return;
		} else {
			//console.log('received message ',message_packet);
		}

		if(message_packet.text !== 'join' && _this.remote_player_mobiles[player_id] === undefined){
			//console.log('invalid player '+player_id);
			return;
		}
		var ship = _this.remote_player_mobiles[player_id];
		//console.log('sending command to ',ship);
		//TODO: call the normal handlers instead of a separate set
		switch(message_packet.text){
			case 'join':
				var new_ship = _this.make_ship(false);
				//console.log('HERE*********');
				new_ship.set_name(message_packet.author);
				_this.add_player(message_packet.author, new_ship);
				break;
			case 'thrust': //thrust pressed
				//console.log('thrust pressed');
				ship.thrust();
				break;
			case 'turn_right': //turn right
				//console.log('turn right pressed');
				//event "this" redeclaration workaround #1
				//_this.player_mobile.turn();
				//event "this" redeclaration workaround #2, see //REDEC WORKAROUND #2 for more details
				ship.turn(1);
				break;
			case 'brake': //brake pressed, not currently used
				//console.log('brake pressed');
				break;
			case 'turn_left': //turn left pressed
				//console.log('turn left pressed');
				ship.turn(-1);
				break;
			case 'stop_thrust': //thrust pressed
				//console.log('thrust keyup',this.player_mobile);
				ship.stop_thrust();
				break;
			case 'stop_turn': 
				//console.log('turn keyup');
				ship.stop_turn();
			default:
				//console.log('something else keyup'+e.which);			
		}		
	}
	this.add_player = function(name, ship){
		this.remote_player_mobiles[name]=ship;
	}
	this.connect_to_server = function(){
		this.set_player_name();
		this.network.send_message(this.player_mobile.name,'join');

	}
	this.attach_body_event_handlers = function(){
 		//REDEC WORKAROUND #2
		//bind way that connects the handle_keypress handler to the keypress event, 
		//binding the current object(game_controller) to the "this" keyword instead 
		//of the dom element that triggered the event

		$('body').on('keypress',this.handle_keypress.bind(this));
		$('body').on('keyup',this.handle_keyup.bind(this));
		//$('body').on('keypress',this.handle_keypress); //standard way
	}
	this.ship_move_handler = function(ship){
		// var ship_pos = ship.get_position();
		// var ship_size = ship.get_size();
		// var bounds = {
		// 	left: 0 - ship_size.width,
		// 	top: 0 - ship_size.height,
		// 	bottom: this.height+ship_size.height,
		// 	right: this.width + ship_size.width
		// }
		if(!this.check_for_collision(this,ship)){
			this.edge_warp_ship(ship);
		}
	}
	this.edge_warp_ship = function(ship){
		var ship_bounds = ship.get_bounds();
		var my_bounds = this.get_bounds();
		var ship_position = ship.get_position();
		var new_x=ship_position.left;
		var new_y=ship_position.top;
		if(ship_bounds.right < my_bounds.left){
			new_x = my_bounds.right;
		} else if(ship_bounds.left > my_bounds.right){
			new_x = 0;
		}
		if(ship_bounds.bottom < my_bounds.top){
			new_y = my_bounds.bottom;
		} else if(ship_bounds.top > my_bounds.bottom){
			new_y = 0;
		}
		ship.set_position({x:new_x,y:new_y});
	}
	this.check_for_collision = function(element1, element2){

		var e1_bounds = element1.get_bounds();		
		var e2_bounds = element2.get_bounds();		
		if(
			e1_bounds.right < e2_bounds.left 
						   ||
			e1_bounds.left > e2_bounds.right 
			               ||
			e1_bounds.top > e2_bounds.bottom 
			               ||
			e1_bounds.bottom < e2_bounds.top
		){
			return false
		}
		return true;
	}
	this.get_bounds = function(){
		var position = this.game_area.position();
		var bounds = {
			left: position.left,
			top: position.top,
			bottom: position.left + this.height,
			right: position.top + this.width
		}
		return bounds;
	}
}

var game_object_constructor = function(parent){
	this.parent = parent;
	this.dom_element = null;
	this.name = null;
	this.status = null;
	this.width;
	this.mid_width;
	this.height;
	this.mid_height;
	this.vectors = {x: 0, y: 0};
	this.stats_per_second = {
		turn_speed : 200,
		engine_power : 10,
		thrust_bleed : 3
	}
	this.vector_angle = 0;
	this.ship_angle = 0;
	this.offset_angle = 0;
	this.turn_speed = 5;
	this.engine_power = .5;
	this.max_speed = 30;
	this.thrust_on = false;
	this.heartbeat_interval = 30;
	this.thrust_value = 0;
	this.thrust_bleed = 2;
	this.turn_direction = 0;

	this.init = function(){
		var dom_element = this.create_dom_element();
		this.get_dom_size();
		this.update_stats_to_heartbeat();
		this.start_heartbeat();

		return dom_element;
	}
	this.update_stats_to_heartbeat = function(){
		var intervals = 1000 / this.heartbeat_interval;
		for(var i in this.stats_per_second){
			this[i] = this.stats_per_second[i]/intervals;
		}
	}
	this.create_dom_element = function(){
		this.dom_element = $("<div>",
			{
				id: 'ship',
				class: 'ship_class'
			}
		);
		return this.dom_element;
	}
	this.set_position = function(x_or_xy_coord, y){
		var coord_obj = {};
		if(typeof x_or_xy_coord != 'object'){
			coord_obj = {
				left: x_or_xy_coord+'px',
				top: y+'px'
			}
		}
		else{
			coord_obj.left = x_or_xy_coord.x;
			coord_obj.top = x_or_xy_coord.y;
		}
		this.dom_element.css(coord_obj);
	}
	this.get_dom_size = function(){
		this.width = this.dom_element.width();
		this.height = this.dom_element.height();
		this.mid_width = this.width/2;
		this.mid_height = this.height/2;
		var output = {
			width: this.width,
			height: this.height,
			mid_width: this.mid_width,
			mid_height: this.mid_height
		}
		return output;
	}
	this.turn = function(direction){
		this.turn_direction = direction;
	}
	this.perform_turn = function(){
		if(this.turn_direction != 0){
			var new_angle = this.ship_angle+(this.turn_speed*this.turn_direction);
			this.dom_element.css({
				'transform' : 'rotateZ('+new_angle+'deg)'
			});
			this.ship_angle = new_angle;
		}
	}
	this.stop_turn = function(){
		this.turn_direction = 0;
	}
	this.get_radians = function(degrees){
		return (Math.PI/180) * degrees;
	}
	this.change_vector = function(){
		this.vectors.x -= Math.cos(this.get_radians(this.ship_angle+this.offset_angle)) * this.engine_power;
		this.vectors.y += Math.sin(this.get_radians(this.ship_angle+this.offset_angle)) * this.engine_power;
	}
	this.move_ship = function(){

		this.dom_element.css({
			top : '+='+this.vectors.x+'px',
			left : '+='+this.vectors.y+'px'
		});
		this.parent.ship_move_handler(this);	
	}
	this.thrust = function(){
		this.thrust_on =true;
	}
	this.stop_thrust = function(){
		this.thrust_on = false;
	}
	this.add_thrust = function(){
		if(this.thrust_value + this.engine_power > this.max_speed){
			this.change_vector();
		} else{
			this.change_vector();
		}
	}
	this.start_heartbeat = function(){
		if(this.heartbeat!=null){
			this.stop_heartbeat();
		}
		this.heartbeat = setInterval(this.perform_heartbeat.bind(this),this.heartbeat_interval);
	}
	this.stop_heartbeat = function(){
		if(this.heartbeat != null){
			clearInterval(this.heartbeat);
		}
	}
	this.thrust_reduce = function(){
		//console.log('thrust reduce called:'+this.thrust_value);

		if(this.thrust_value - this.thrust_bleed > 0){
			this.thrust_value -= this.thrust_bleed;
		} else {
			this.thrust_value = 0;
		}
	}
	this.perform_heartbeat = function(){
		if(this.thrust_on){
			this.add_thrust();
		} else {
			//this.thrust_reduce();
		}
		this.perform_turn();
		this.move_ship();
		
	}
	this.wrap_check = function(){

	}
	this.get_position = function(){
		return this.dom_element.position();
	}
	this.get_size = function(){
		var output = {
			width: this.width,
			height: this.height,
			mid_width: this.mid_width,
			mid_height: this.mid_height
		};
		return output;	
	}
	this.get_bounds = function(){
		var position = this.dom_element.position();
		var bounds = {
			left: position.left,
			top: position.top,
			bottom: position.top + this.height,
			right: position.left + this.width
		}
		return bounds;
	}
}






