'use strict';

const express = require('express');
const { Server } = require('ws');

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new Server({ server });

var Matchs={}
var MatchsAdmin = {}
var Subscribers={}

wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.on('close', () => console.log('Client disconnected'));
  
  
  ws.on('message', (data) => {
	  try {
		console.log(data)
		var matchData = JSON.parse(data)
		console.log(matchData.action)
		if(matchData.action == "register"){
			
			/* generate 2 token, one for admin and one for subscriber */
			
			var matchId = (new Date()).getTime().toString(36)
			var matchIdAdmin = Math.random().toString(36).slice(2)
			
			console.log(matchId);
			if(matchId in Matchs){
				console.log("match existing, cannot continue");
			}else{
				Matchs[matchId] = matchData
				MatchsAdmin[matchId] = matchIdAdmin
				Subscribers[matchId] = []
				ws.send(JSON.stringify({"mid":matchId,"admin":matchIdAdmin}));
			}
			
		}else if(matchData.action == "update"){
			
			var matchId = matchData.matchId

			if(matchId in Matchs && matchData.admin == MatchsAdmin[matchId] ){
				
				Subscribers[matchId].forEach((client) => {
					client.send(JSON.stringify(matchData));
				});
				
				if("matchPoint" in matchData){
					Matchs[matchId].matchPoint = matchData.matchPoint
				}
				
				if("PlayerName" in matchData){
					Matchs[matchId].PlayerName = matchData.PlayerName
				}		

				if("server" in matchData){
					Matchs[matchId].server = matchData.server
					Matchs[matchId].serveClass = matchData.serveClass
				}
						
						
			}else{
				console.log("match not found");
				console.log(matchId);
			}
		}else if(matchData.action == "subscribe"){
			var matchId = matchData.matchId
			if(matchId in Matchs){
				Subscribers[matchId].push(ws);
				ws.send(JSON.stringify(Matchs[matchId]));
			}else{
				ws.send(JSON.stringify({"error":"match not found"}));
			}
		}else if(matchData.action == "get"){
			var matchId = matchData.matchId
			if(matchId in Matchs){
				ws.send(JSON.stringify(Matchs[matchId]));
			}
		}else if(matchData.action == "delete"){
			var matchId = matchData.matchId
			var admin = matchData.admin
			if(matchId in Matchs && admin == MatchsAdmin[matchId] ){
				delete Matchs.matchId;
				delete MatchsAdmin.admin;
			}
		}
		
	}
	catch (e) {
	  console.log(e);

	}
  });
  
  
});
/*
setInterval(() => {
  wss.clients.forEach((client) => {
    client.send(new Date().toTimeString());
  });
}, 1000);
*/