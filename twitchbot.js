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
const discordFunctions = require(`./functions/discordfunctions.js`);
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
    let messageArray = message.content.split(" ");//Create array from message sent in chat
    let cmd = messageArray[0].slice(1);//Grab the command from the array
    let args = messageArray[1];//Grab the argument from the array

    if(message.content.startsWith(botconfig.prefix))
    {
        //If the channel the command is ran is not the bot channel, delete the message
        if(thisChannel !== botChannel)return;

        //Verify the discord user is the broadcaster for the twitch channel
        if(cmd === "verify")
        {
            discordFunctions.verifyChannel(args, message, fs, fsextra, jsonfile, client);
        }
        
        //if the command is the /join command in discord
        if(cmd === "join")
        {
            var code = discordFunctions.generateCode(6);//Generate a random 6 digit code
            discordFunctions.joinChannel(args, message, fs, client, jsonfile, code);
        }

        //
        if(cmd === "leave")
        {
            var code = discordFunctions.generateCode(8);//Generate a random 6 digit code
            discordFunctions.leaveChannel(args, message, fs, client, jsonfile, code);
        }

        //Check how many people banned in a channel
        if(cmd === "bans")
        {
            discordFunctions.banCount(args, message, fs);
        }
        //Check if a user is banned in channels
        if(cmd === "banned")
        {
            discordFunctions.checkBanned(fs, path, message, args);
        }

        //Command list
        if(cmd === "commands" || cmd === "help" || cmd === "?")
        {
            //Tell the user how to get started using the bot
            return message.channel.send("To get started, type ``/join CHANNELNAME`` here. Please keep in mind that you can only add the bot to your own channel and no one elses.");
        }
        
        //Bot info command
        if(cmd === "botinfo")
        {
            //Send info about the bot and who made it
            return message.channel.send("This bot is run and coded by Gravvy. The purpose of this bot is to log bans from Twitch channels and keep a database of them. This bot does *not* have any capability to send messages in Twitch chats.");
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
const twitchFunctions = require(`./functions/twitchfunctions.js`);//Not used at the moment
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

client.on("connected", (address, port) => {
    //Create counter for connected channels
    var conChannels = 0;

    //Logs connection status to channel(s)
    for(var i = 0; i < options.channels.length; i++)
    {
        conChannels += 1;//Increase the connected channels counter
        /*var chan = options.channels[i];
        console.log(chan, "is connected.");//Log connection status to the console*/
    }

    console.log(`Connected to [${conChannels}] Twitch channels.`);//Log the amount of channels connected in console
});

//Triggered upon joining a channel. Gives you the current state of the channel.
client.on("roomstate", (channel, state) => {
    //Define the channel file
    var file = `./channels/${channel.slice(1)}.json`;

    //Check to see if channels json file exists
    fsextra.ensureFile(file).then(() => {
        //Nothing needs to be done here
    }).catch(err => {
        return console.log(`ensureFile: ${err}`);
    });
});

//Log if the bot disconnects from Twitch
client.on("disconnected", (reason) => {
    for(var i = 0; i < options.channels.length; i++)
    {
        var chan = options.channels[i];
        console.log(chan, "RPBot9000 disconnected.");//Log in the console that the bot has disconnected from a twitch channel
    }
});

//Run on a ban done by a moderator/broadcaster in a twitch channel
client.on("ban", (channel, username, reason, userstate) => {
    if(logBans)
    {
        let chatBans = botconfig.chatBans;//Define the channel name to submit channel bans to
        let logChannel = bot.channels.find(c => c.name === chatBans);//Get the channel from discord
        var chn = channel.slice(1);//Remove the # from the twitch channel name
        var usrnme = username;//Get the username of the user that was banned
        var file = `./channels/${channel.slice(1)}.json`;//Define the channel file name to be created
        var d = new Date();//Create a new date from the current time and date
        var day = d.getDate();//Get current day
        var month = d.getMonth()+1;//Get current month
        var year = d.getFullYear();//Get current year
        var dte = `${month}-${day}-${year}`;//Combine current day/month/year
        var obj = { name: `${usrnme}`, reason: `${reason}`, date: `${dte}` };//Define what will be put into the channel file

        //If the bot is banned from a channel
        if(usrnme === "rpbot9000" || usrnme === "RPBot9000")
        {
            //Delete that channels file
            fs.unlink(file, (err) => {
                if(err)return console.log(err);
            });

            //Manually leave channel to make sure the bot does not reconnect
            return client.part(`#${chn}`).then((data) => {return console.log(`RPBot9000 was banned from channel ${chn}`)}).catch((err) => {return console.log(`LEAVE Error: ${err} | ${chn}`);});
        }

        //Write banned user information to the channel file
        jsonfile.writeFile(file, obj, {flag: "a"}, function (err) {
            if(err)return console.error(err);
        });
        
        //Log the banned user in discord
        return logChannel.send("```diff"+`\n-Banned_User\n+[Channel:] ${chn}\n+[User:] ${usrnme}\n+[Date:] ${dte}`+"```");
    }
});

//Run on a timeout done by a moderator/broadcaster in a twitch channel
client.on("timeout", (channel, username, reason, duration, userstate) => {
    if(logTimeouts)
    {
        let chatBans = botconfig.chatBans;//Define the channel name to submit channel timeout to
        let logChannel = bot.channels.find(c => c.name === chatBans);//Get the channel from discord
        var chn = channel.slice(1);//Remove the # from the twitch channel name
        var usrnme = username;//Get the username of the user that was timed out

        var file = `./channels/${channel.slice(1)}.json`;//Define the channel file name to be created
        var d = new Date();//Create a new date from the current time and date
        var day = d.getDate();//Get current day
        var month = d.getMonth()+1;//Get current month
        var year = d.getFullYear();//Get current year
        var dte = `${month}-${day}-${year}`;//Combine current day/month/year
        var obj = { name: `${usrnme}`, reason: `${reason}`, date: `${dte}` };//Define what will be put into the channel file

        //Write timed out user information to the channel file
        jsonfile.writeFile(file, obj, {flag: "a"}, function (err) {
            if(err)return console.error(err);
        });
        
        //Log the timed out user in discord
        return logChannel.send("```css"+`\n.TimedOut_User\n+[Channel:] ${chn}\n+[User:] ${usrnme}\n+[Duration:] ${duration}\n+[Date:] ${dte}`+"```");
    }
});

//Receieve a whisper from a user on twitch
client.on("whisper", (from, userstate, message, self) => {
    if(self)return;//If the whisper is from myself, ignore it

    //Send a reply to the user that sent the whisper
    return client.whisper(from, "Uh oh! I'm just a bot! If you are intrested in adding this bot to your twitch channel, please visit us on discord at https://discord.io/rpbot9000").then((data) => {
        // data returns [username, message]
    }).catch((err) => {
        console.log(err);//Log all errors
    });
})