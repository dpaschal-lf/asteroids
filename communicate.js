
 function network_template(){
 	this.url = 'localhost:8001';
 	this.ws = null;
 	this.socket_connected=false;
 	this.message_callback = null;
 	this.connect_callback = null;
 	this.webSocketClose = function(){
 		this.ws.close();
 	}
	this.webSocketInit=function (parent)
	 {
	 	var parent=this;
	 	console.log('testing');
	    if ("WebSocket" in window)
	    {

	       console.log('connecting');
	       // Let us open a web socket
	       this.ws = new WebSocket("ws://"+this.url+"/echo");

	       this.ws.onopen = function()
	       {
	          // Web Socket is connected, send data using send()
	          parent.socket_connected=true;
	          console.log("this: ",self);
	          parent.display_connection();
	          console.log('connected');
	          parent.connect_callback();
					//$("#connect").text('connected').prop('disabled',true);
	       };
			
	       this.ws.onmessage = function (evt) 
	       { 
	       	  if(parent.message_callback==null){
	       	  	return;
	       	  }

              var received_msg = evt.data;
              console.log('message is received',evt);
              var packet = JSON.parse(evt.data);
              var html = null;
              var refresh = false;

	          parent.message_callback(evt.data);
	       };
			
	       this.ws.onclose = function()
	       { 
	          // websocket is closed.
	          parent.socket_connected=false;
	          parent.display_connection();
	          alert("Connection is closed..."); 
	       };
	    }
	    
	    else
	    {
	       // The browser doesn't support WebSocket
	       alert("WebSocket NOT supported by your Browser!");
	    }
	 }

	this.register_message_callback = function(callback){
		this.message_callback = callback;
	}
	this.display_connection=function(){
		if(!this.socket_connected){
			$("#connect").text('connect');
		} else{
			$("#connect").text('disconnect');
		}
	}
	this.socket_toggle=function(connect_callback){
		this.connect_callback = connect_callback;
		if(this.socket_connected===false){
			this.webSocketInit.call(this);
		} else{
			this.webSocketClose.call(this);
		}
	}
	this.send_message=function(sender,message){
		if(this.ws){
			var packet = {
				action:'message',
				message: message,
				sender: sender
			}
			this.ws.send(JSON.stringify(packet));    	
		}
		else{
			console.log('no connection to send');
		}
	}
	this.send_name = function(name){
         console.log('sent name config');

         var packet = {
            action: 'config',
            name: name
         }
         this.ws.send(JSON.stringify(packet)); 
    }
	this.display_message=function(message,sender){
		var message_row = $("<div>",{
			class: 'message_row',
		});
		var message_text = $("<div>",{
			class: 'message_text',
			text: message
		});
		var message_sender = $("<div>",{
			class: 'message_sender',
			text: sender
		})
		message_row.append(message_sender,message_text);
		$("#message_area").append(message_row);
	}
	this.set_connection=function(url){
		this.url = url;
	}
 }


