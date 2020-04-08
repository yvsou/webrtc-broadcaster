'use strict';

// Last time updated: 2020-04-08  
// ________________
// websocketgroupvideocastchat.js v1.0.0
// 
// --------------------------------------------------
// lican huang      www.yvsou.com    Hangzhou Domain Zones Technology Co., Ltd

// Apache Licence 2.0       https://www.apache.org/licenses/LICENSE-2.0
// --------------------------------------------------
// ____________
//  websocketgroupvideocastchat.js 

var socket;
var broadcaster;
var userlist = new Array();  


const SEND_TEXT = 'SEND_TEXT'; 
const SEND_LOG = 'SEND_LOG';
const USER_JOIN = 'USER_JOIN';
const USER_LEAVE = 'USER_LEAVE';
const REPORT_ONLINE = 'REPORT_ONLINE';
 
 
var connection = null;
var clientID = 0;

var myUsername = null;
var targetUsername = null;      // To store username of other peer
 
var peerConnections = {};
var transceiver = null;         // RTCRtpTransceiver
var webcamStream = null;        // MediaStream from webcam
 
var myPeerConnection = null;    // RTCPeerConnection
 

 
myUsername = document.getElementById("userid").value;


broadcaster = document.getElementById("broadcaster").value ;
if (broadcaster ==1)
   var peerConnection = null;    // RTCPeerConnection

var videoElement = document.getElementById("local_video");
var video = document.getElementById("received_video");
 
var mediaConstraints = {
 //  video: { facingMode: "environment" }, audio: true
    video: true, audio: true
};

 
 
const iceConfig = {"iceServers": [
        {
          url:"turn:yourdomane", username:"youraccount", credential:"yourpassword" ,
       
        }
            
      ]
 };
 

if (!window.WebSocket) {
			window.WebSocket = window.MozWebSocket;
		}
if (window.WebSocket) {

               
                  socket = new WebSocket("wss://yourdomain:port/ws");
               
                  socket.onmessage = function(event) {
				                var ta = document.getElementById('responseText');
                        var now = new Date();  
                        var msgvalue =       event.data.split("|");

                        var msguserarr = msgvalue[msgvalue.length-2]; 
                        var msgusera  = msguserarr.split(":");  
                        var msguser  = msgusera[msgusera.length-1]; 

                        var msggrouparr = msgvalue[msgvalue.length-3]; 
                        var msggroupa = msggrouparr.split(":");  
                        var msggroup  = msggroupa[msggroupa.length-1]; 

                        var msggflagarr = msgvalue[msgvalue.length-4]; 
                        var msggflaga= msggflagarr.split(":");  
                        var gflag = msggflaga[msggflaga.length-1]; 


                        var msgcoming = msgvalue[msgvalue.length-1]; 
                        if (msguser.trim().length == 0)  
                            msguser = msgvalue[ 1]; 

                        if  ((document.getElementById("groupid").value == msggroup) && (gflag == 1))   {

       
                          const msg = JSON.parse(msgcoming);
                          const  type  = msg.type ;
                
                          switch(type) {
                             
                        
                          case "video-offer":  // Invitation and offer to chat
                                if  (msg.target ==  myUsername)  
                                   handleVideoOfferMsg(msg);
                                 

                             case "video-answer":  // Callee has answered our offer
                                if (msg.target === myUsername)  
                                   handleVideoAnswerMsg(msg); 
                               
                                  
                                 break;

                            case "new-ice-candidate": // A new ICE candidate received
                                 
                                 if (msg.target === myUsername)  
                                   handleNewICECandidateMsg(msg);
                                
                                 break;

                            case "join-broadcast": // A new ICE candidate received
                             
                                 if  (msg.target == "")  
                                     HnadleJoinBcast(msg); 
                                 break;
                          

                           case "hang-up": // The other peer has hung up the call
                                handleHangUpMsg(msg);
                                break;

                                case USER_JOIN:
                                 reportonline(myUsername) ;
                                 break;    
                                case REPORT_ONLINE:
                                  handleUserlistMsg(msg);
                                  break; 
                                case USER_LEAVE:
                                  handleDeleteUserlistMsg(msg);
                                  break; 
                              
                              
                               case SEND_TEXT:
                            
                                  ta.value =   msguser + "    " +now.getHours() + ":" + now.getMinutes() +":" + now.getSeconds() + '\n' +  msg.payload +   '\n' +  '\n' +     ta.value  + '\n'  ;
                                   break; 
                               case SEND_LOG:
                            
                                  ta.value =    msgcoming  +   '\n' +  '\n' +     ta.value  + '\n'  ;
                                  break;   
                                  
                               default:
	 		                            log_error("Unknown message received:");
                                  log_error(msg);
                               break;     
	                        }
 
                   }
	
  	};
			socket.onopen = function(event) {
			  	var ta = document.getElementById('status');
				  ta.value = "open";
                
                    document.getElementById('sendmsg').style.display = "block";
 
                    document.getElementById('reconnect').style.display = "none";
                           
                    Userjoin();
                     
			};
			socket.onclose = function(event) {
				var ta = document.getElementById('status');
				ta.value =  "close";
                            
                    document.getElementById('sendmsg').style.display = "none";
                    document.getElementById('reconnect').style.display = "block";
                         
                    Userleave(myUsername); 
                                   
			};

       socket.error = function() {
		     var ta = document.getElementById('status');
			   ta.value =  "error";
	     };
		} else {
			  alert("no support WebSocket!");
		}

		function send(message) {
			if (!window.WebSocket) {
				return;
			}
			if (socket.readyState == WebSocket.OPEN) {
        message=  "gflag:1"  + "|groupid:" +document.getElementById("groupid").value + "|userid:" + document.getElementById("userid").value  +"|" + message;
				socket.send(message);
			} else {
				alert("no connected.");
			}
		}
                
    function websreconnect() {
			if (!window.WebSocket) {
				return;
			}
			 
             
    socket = new WebSocket("wss://yourdomain:port/ws");
            

		socket.onmessage = function(event) {
                          
                          var ta = document.getElementById('responseText');
                          
                          var now = new Date();  
                                  var msgvalue =       event.data.split("|");
                                  var msguserarr = msgvalue[msgvalue.length-2]; 
                                  var msgusera  = msguserarr.split(":");  
                                  var msguser  = msgusera[msgusera.length-1]; 

                                  var msggrouparr = msgvalue[msgvalue.length-3]; 
                                  var msggroupa = msggrouparr.split(":");  
                                  var msggroup  = msggroupa[msggroupa.length-1]; 
                                  var msggflagarr = msgvalue[msgvalue.length-4]; 
                                  var msggflaga= msggflagarr.split(":");  
                                  var gflag = msggflaga[msggflaga.length-1]; 


                                  var msgcoming = msgvalue[msgvalue.length-1]; 
                                  if (msguser.trim().length == 0)  
                                      msguser = msgvalue[ 1]; 
         
                
                        if  ((document.getElementById("groupid").value == msggroup) && (gflag == 1))  {
  
                           const msg = JSON.parse(msgcoming);
                           const  type  = msg.type ;  
                           
	                         switch(type) {
                          
                             case "video-offer":  // Invitation and offer to chat
                                 if  (msg.target ==  myUsername)  
                                   handleVideoOfferMsg(msg);
                                 
                                  break;
                                   
                             case "video-answer":  // Callee has answered our offer
                                 if (msg.target === myUsername)  
                                   handleVideoAnswerMsg(msg); 
                                  
                                 break;

                            case "new-ice-candidate": // A new ICE candidate received
                               
                                 if (msg.target === myUsername)  
                                   handleNewICECandidateMsg(msg);
                                 
                                 break;
                               
                            case "join-broadcast": // A new ICE candidate received
                             
                                 if  (msg.target == "")  
                                     HnadleJoinBcast(msg); 
                                 break;

                         
                           case "hang-up": // The other peer has hung up the call
                                handleHangUpMsg(msg);
                                break;

                            case USER_JOIN:
                                 reportonline(myUsername) ;
                                 break;  
  
                            case REPORT_ONLINE:
                                 handleUserlistMsg(msg);
                                 break; 
                            case USER_LEAVE:
                                 handleDeleteUserlistMsg(msg);
                                 break; 
                               
                            case SEND_TEXT:
                                 ta.value =   msguser + "    " +now.getHours() + ":" + now.getMinutes() +":" + now.getSeconds() + '\n' +  msg.payload +   '\n' +  '\n' +     ta.value  + '\n'  
                                 break; 

                            case SEND_LOG:
                            
                                 ta.value =    msgcoming  +   '\n' +  '\n' +     ta.value  + '\n'  ;                 
                                 break; 
                           
                            default:
                                 log_error("Unknown message received:");
                                 log_error(msg);
	 		                       	  break;                
      		       
	                   }
                 }

    	};
			socket.onopen = function(event) {
				var ta = document.getElementById('status');
				ta.value = "open";               
        document.getElementById('sendmsg').style.display = "block"; 
        document.getElementById('reconnect').style.display = "none";                       
        Userjoin(); 
			};
			socket.onclose = function(event) {
				var ta = document.getElementById('status');
				ta.value =  "close";                         
        document.getElementById('sendmsg').style.display = "none";
        document.getElementById('reconnect').style.display = "block";
        Userleave(myUsername); 
                                    
			};

      socket.error = function(){
		    var ta = document.getElementById('status');
			  ta.value =  "error";
	    };
 }
 

 
   
function sendToServer(msg) {
  var msgJSON = JSON.stringify(msg);
  send(msgJSON);
 }


   
function adduserlist(username) {
  if (!userlist.includes(username)){
      userlist.push(username);
      return true; 
  }
    return false; 
}
 

  
function deleteuserlist(username) {
 
 var i = userlist.indexOf(username);
 userlist.splice(i,1);
  
}



function handleUserlistMsg(msg) {
  if (!adduserlist(msg.username))
     return;
// sendlogmessage(msg); 
  
  var i;
  
  var listElem = document.getElementById("userlistbox");
  
  for(i=listElem.options.length-1 ; i>= 0 ; i--)
      listElem.options[i] = null; 
      userlist.forEach(function(username) {
      listElem.options.add(new Option(username ,username)); 
  });
}

 

function handleDeleteUserlistMsg(msg) {
 // sendlogmessage(msg); 
  deleteuserlist(msg.username);
 
  var i;
  var listElem = document.getElementById("userlistbox");
  
  for(i=listElem.options.length-1 ; i>= 0 ; i--)
      listElem.options[i] = null;
      userlist.forEach(function(username) {
         listElem.options.add(new Option(username ,username)); 
      });
}

 
 
function log(text) {
 // var time = new Date();
 // sendlogmessage("[" + time.toLocaleTimeString() + "] " + text);
}

// Output an error message to console.

function log_error(text) {
 //  var time = new Date();
 // sendlogmessage("[" + time.toLocaleTimeString() + "] " + text);
}



function reportError(errMessage) {
  sendlogmessage(`Error ${errMessage.name}: ${errMessage.message}`);
}


 

function Userjoin() {
  //sendlogmessage("Userjoin");
  sendToServer({
     type: USER_JOIN
  });
}


function Userleave(username) {
   // sendlogmessage("Userleave");
  sendlogmessage(username); 
  sendToServer({
     username: username,
     type: USER_LEAVE
  });
}


function reportonline(username) {
   log("reportonline");
   log(username); 
   sendToServer({
     username: username,
     type: REPORT_ONLINE
   });
}

 


function sendtextmessage(msg){
    sendToServer({
            type:SEND_TEXT,            
            textmsg: msg 
    });
    
}

function sendlogmessage(msg){
    sendToServer({
            type:SEND_LOG,            
            log: msg 
     });    
}


async function JoinBcast() {
 sendToServer({
    name: myUsername,
    target: "",
    type: "join-broadcast"
  });

}


async function castercreatePeerConnection(userid) {
  log("castercreatePeerConnection Setting up a connection..." + userid );
 
  const targetpeerConnection =   new RTCPeerConnection(iceConfig);
  peerConnections[userid] = targetpeerConnection ;
 
  
  targetpeerConnection.onicecandidate = handleICECandidateEvent;
  targetpeerConnection.oniceconnectionstatechange = handleICEConnectionStateChangeEvent;
  targetpeerConnection.onicegatheringstatechange = handleICEGatheringStateChangeEvent;
  targetpeerConnection.onsignalingstatechange = handleSignalingStateChangeEvent;
  targetpeerConnection.onnegotiationneeded = handleNegotiationNeededEvent;
  targetpeerConnection.ontrack = handleTrackEvent;
}



async function createPeerConnection() {
  log("Setting up a connection...");
 
  myPeerConnection = new RTCPeerConnection(iceConfig);
  
  myPeerConnection.onicecandidate = handleICECandidateEvent;
  myPeerConnection.oniceconnectionstatechange = handleICEConnectionStateChangeEvent;
  myPeerConnection.onicegatheringstatechange = handleICEGatheringStateChangeEvent;
  myPeerConnection.onsignalingstatechange = handleSignalingStateChangeEvent;
  myPeerConnection.onnegotiationneeded = handleNegotiationNeededEvent;
  myPeerConnection.ontrack = handleTrackEvent;
}

 
  
async function handleNegotiationNeededEvent() {
  log("*** Negotiation needed");

  try {
    log("---> Creating offer");
    const offer = await this.createOffer();
   
    if (this.signalingState != "stable") {
      log("     -- The connection isn't stable yet; postponing...")
      return;
    }
 

    log("---> Setting local description to the offer");
    await this.setLocalDescription(offer);

    // Send the offer to the remote peer.

    log("---> Sending the offer to the remote peer");
    sendToServer({
      name: myUsername,
      target: targetUsername,
      type: "video-offer",
      sdp: this.localDescription
    });
  } catch(err) {
    log("*** The following error occurred while handling the negotiationneeded event:");
    reportError(err);
  };
}

  

function handleTrackEvent(event) {
  log("*** Track event");
  document.getElementById("received_video").srcObject = event.streams[0];
 // document.getElementById("hangup-button").disabled = false;
}
 

function handleICECandidateEvent(event) {
  if (event.candidate) {
    log("*** Outgoing ICE candidate: " + event.candidate.candidate);

    sendToServer({
      type: "new-ice-candidate",
      name: myUsername, 
      target: targetUsername,
      candidate: event.candidate
    });
  }
}
 

function handleICEConnectionStateChangeEvent(event) {
  log("*** ICE connection state changed to " + this.iceConnectionState);

  switch(this.iceConnectionState) {
    case "closed":
    case "failed":
    case "disconnected":
      closeVideoCall();
      break;
  }
}
 

function handleSignalingStateChangeEvent(event) {
  log("*** WebRTC signaling state changed to: " + this.signalingState);
  switch(this.signalingState) {
    case "closed":
      closeVideoCall();
      break;
  }
} 

function handleICEGatheringStateChangeEvent(event) {
  log("*** ICE gathering state changed to: " + this.iceGatheringState);
}

  

function closeVideoCall() {
   // unfinished yet
} 

function handleHangUpMsg(msg) {
  log("*** Received hang up notification from other peer");

  closeVideoCall();
}
 

function hangUpCall() {
  closeVideoCall();

  sendToServer({
    name: myUsername,
    target: targetUsername,
    type: "hang-up"
  });
}
 

 
 
async function HnadleJoinBcast(msg) {
   
  targetUsername = msg.name;
  if ( broadcaster !=1)
      return;
  if (myUsername ==  msg.name)
        return;
  log("Starting to  an invitation");
  
  if (peerConnections[targetUsername]) {
    // peerConnections[targetUsername] = null; 
    // alert("You can't start a call because you already have one open!");
  }else{
   
    // Record the username being called for future reference
 
    log("Inviting user " + targetUsername);

    log("Setting up connection to invite user: " + targetUsername);
  
    if (!peerConnections[targetUsername] ) {
      castercreatePeerConnection(targetUsername);
    }
   
 
    try {
      webcamStream.getTracks().forEach(
          transceiver = track => peerConnections[targetUsername].addTrack(track,   webcamStream  )  
       );
    } catch(err) {
      handleGetUserMediaError(err);
    }
  }
}

 
 
 


 

async function handleVideoOfferMsg(msg) {
  targetUsername = msg.name;
 
  log("Received video chat offer from " + targetUsername);
  if (!myPeerConnection) {
    createPeerConnection();
  }

  
  var desc = new RTCSessionDescription(msg.sdp);

  
  if (myPeerConnection.signalingState != "stable") {
    log("  - But the signaling state isn't stable, so triggering rollback");
 
    await Promise.all([
      myPeerConnection.setLocalDescription({type: "rollback"}),
      myPeerConnection.setRemoteDescription(desc)
    ]);
    return;
  } else {
    log ("  - Setting remote description");
    await myPeerConnection.setRemoteDescription(desc);
  }

  // Get the webcam stream if we want the broacaster receives it
/*
  if (!webcamStream) {
    try {
      webcamStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
    } catch(err) {
      handleGetUserMediaError(err);
      return;
    }

    document.getElementById("local_video").srcObject = webcamStream;

    // Add the camera stream to the RTCPeerConnection

    try {
      webcamStream.getTracks().forEach(
    //  transceiver = track => myPeerConnection.addTransceiver(track, {streams: [webcamStream]})
        transceiver = track => myPeerConnection.addTrack(track,   webcamStream  )  
      );
    } catch(err) {
      handleGetUserMediaError(err);
    }
  }
*/
  log("---> Creating and sending answer to caller");

  await myPeerConnection.setLocalDescription(await myPeerConnection.createAnswer());

  sendToServer({
    name: myUsername,
    target: targetUsername,
    type: "video-answer",
    sdp: myPeerConnection.localDescription
  });
}
 

async function handleVideoAnswerMsg(msg) {
  log("*** Call recipient has accepted our call");


   var desc = new RTCSessionDescription(msg.sdp);
   await peerConnections[msg.name].setRemoteDescription(desc).catch(reportError);
}
 

 

async function handleNewICECandidateMsg(msg) {
  var candidate = new RTCIceCandidate(msg.candidate);

  log("*** Adding received ICE candidate: " + JSON.stringify(candidate));
  

  try {
     
      if ( broadcaster ==1)    {
        log (peerConnections);
        log (msg.name);
        log (peerConnections[msg.name]);  
        await peerConnections[msg.name].addIceCandidate(candidate)
       
     } else {
         await myPeerConnection.addIceCandidate(candidate) 
     }
  
     
} catch(err) {
    reportError(err);
  }
}

 

  

function handleGetUserMediaError(e) {
  log_error(e);
  switch(e.name) {
    case "NotFoundError":
      alert("Unable to open your call because no camera and/or microphone" +
            "were found.");
      break;
    case "SecurityError":
    case "PermissionDeniedError":
      // Do nothing; this is the same as the user canceling the call.
      break;
    default:
      alert("Error opening your camera and/or microphone: " + e.message);
      break;
  }
 

  closeVideoCall();
}

  



async function initbroadcast() {
    log("Starting to prepare an initbroadcast");
    
    try {
      if ( broadcaster  == 1 ) {
        webcamStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);        
        videoElement.srcObject = webcamStream;
     }
    } catch(err) {
      handleGetUserMediaError(err);
      return;
    }
   
}



  if ( broadcaster ==1){
   
      initbroadcast();
    }
 



 




 

 
       
