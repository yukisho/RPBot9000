////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                ToDo List                                               //
//                                                                                                        //
//              Create a function on the twitch bot to check for unban events then remove                 //
//              that user from the channel file                                                           //
//                                                                                                        //
//                                                                                                        //
//                                                                                                        //
//                                                                                                        //
////////////////////////////////////////////////////////////////////////////////////////////////////////////



///////////////////
////DISCORD BOT////
///////////////////
const botconfig = require("./botconfig.json");
const Discord = require("discord.js");
const fs = require("fs");
const path = require('path');
const discordFunctions = require(`./functions/discord.js`);
const bot = new Discord.Client();
bot.commands = new Discord.Collection();

bot.on("ready", async () => {
    var DATE = new Date();//Get current time and date
    console.log(`${bot.user.username} is online on [${bot.guilds.size}] Discord server(s)!`);//Log to console the bots connection status to discord servers
    console.log(`Timestamp: ${DATE}`);//Log the time and date the connection occured
    bot.user.setActivity("with Twitch API", {type: "PLAYING"});//Set the bot status message in discord
});

bot.on("message", async message => {
    var serverArray = botconfig.allowedServers;//Get list of allowed discord servers
    var serverID = message.guild.id;//Get the current discord server IDs
    if(serverArray.indexOf(serverID) === -1) return;//Check if the bot is on any other discord servers but the ones it should be on
    if(message.author.bot) return;//If the message is from the bot, ignore the message
    if(message.channel.type === "dm") return;//If the message is in a direct message, ignore it

    let thisChannel = message.channel.name;//Get current channel command is sent in
    let botChannel = botconfig.botChannel;//Define the bot command channel

    if(message.content.startsWith(botconfig.prefix))
    {
        //If the channel the command is ran is not the bot channel, delete the message
        if(thisChannel !== botChannel)return message.delete();

        //Variables
        let sender = message.member.user;
        let messageArray = message.content.split(" ");//Create array from message sent in chat
        let cmd = messageArray[0].slice(1);//Grab the command from the array
        let args = messageArray[1];//Grab the argument from the array
        var code6 = discordFunctions.generateCode(6);//Generate a random 6 digit code
        var code8 = discordFunctions.generateCode(8);//Generate a random 6 digit code

        switch(cmd)
        {
            case "verify": return discordFunctions.verifyChannel(args, message, fs, fsextra, jsonfile, client);
            case "join": return discordFunctions.joinChannel(args, message, fs, client, jsonfile, code6);
            case "leave": return discordFunctions.leaveChannel(args, message, fs, client, jsonfile, code8);
            case "bans": return discordFunctions.banCount(args, message, fs);
            case "banned": return discordFunctions.checkBanned(fs, path, message, args);
            case "history": return discordFunctions.getUserMessages(args, fs, message, sender);
            case "commands": return message.channel.send("To get started, type ``/join CHANNELNAME`` here. Please keep in mind that you can only add the bot to your own channel and no one elses.");
            case "help": return message.channel.send("To get started, type ``/join CHANNELNAME`` here. Please keep in mind that you can only add the bot to your own channel and no one elses.");
            case "?": return message.channel.send("To get started, type ``/join CHANNELNAME`` here. Please keep in mind that you can only add the bot to your own channel and no one elses.");
            case "botinfo": return message.channel.send("This bot is run and coded by Gravvy. The purpose of this bot is to log bans from Twitch channels and keep a database of them. This bot does *not* have any capability to send messages in Twitch chats.");
            default: return message.delete();
        }
    }
});

bot.login(botconfig.token);







//////////////////
////TWITCH BOT////
//////////////////
const tmi = require("tmi.js");
const fsextra = require("fs-extra");
const jsonfile = require("jsonfile");
const twitchFunctions = require(`./functions/twitch.js`);//Not used at the moment
const channelNames = fs.readdirSync(`./channels/`);
const logBans = true;
const logTimeouts = false;
let cNames = new Array();

//Get each channel file name and remove the file extension then add the name to the array
channelNames.forEach(function(element){
    cNames.push(element.slice(-0,-5));
});

//Define TMI config options
const options = {
    options: {
        clientId: "ssw6mekc8hjgdlks0hgh8v1xhfw489",
        debug: false,
    },
    connection: {
        cluster: "aws",
        reconnect: true,
        maxReconnectInterval: 60000,
        reconnectInterval: 2000,
        secure: true,
    },
    identity: {
        username: "RPBot9000",
        password: "oauth:6xrgscvp3z67p9nsyzncnj5ygsfqha",
    },
    channels: cNames,
}

//Create a new TMI client instance
const client = new tmi.client(options);

//Connect the bot to all Twitch channels
client.connect();

//Run when the bot connects to Twitch
client.on("connected", (address, port) => {
    twitchFunctions.onConnect(options);
});

//Triggered upon joining a channel. Gives you the current state of the channel.
client.on("roomstate", (channel, state) => {
    twitchFunctions.onRoomstate(channel, fsextra);
});

//Log if the bot disconnects from Twitch
client.on("disconnected", (reason) => {
    twitchFunctions.onDisconnect(options);
});

//Run on a ban done by a moderator/broadcaster in a twitch channel
client.on("ban", (channel, username, reason, userstate) => {
    if(logBans)
    {
        twitchFunctions.onBan(channel, username, reason, botconfig, bot, fs, client, jsonfile);
    }
});

//Run on a timeout done by a moderator/broadcaster in a twitch channel
client.on("timeout", (channel, username, reason, duration, userstate) => {
    if(logTimeouts)
    {
        twitchFunctions.onTimeout(channel, username, reason, duration, botconfig, bot, fs, client, jsonfile);
    }
});

//Receieve a whisper from a user on twitch
client.on("whisper", (from, userstate, message, self) => {
    if(self)return;
    twitchFunctions.onWhisper(from, message, self, client);
});

//Log user chat messages
client.on("chat", (channel, userstate, message, self) => {
    if(self)return;
    twitchFunctions.logMessages(channel, userstate, message, fs, fsextra);
});