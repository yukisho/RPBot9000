///////////////////
////DISCORD BOT////
///////////////////
const botconfig = require("./botconfig.json");
const Discord = require("discord.js");
const discordFunctions = require(`./functions/discordfunctions.js`);//Not used at the moment
const bot = new Discord.Client();
bot.commands = new Discord.Collection();

bot.on("ready", async () => {
    var DATE = new Date();//Get current time and date
    console.log(`${bot.user.username} is online on ${bot.guilds.size} discord server!`);//Log to console the bots connection status to discord servers
    console.log(`Time: ${DATE}`);//Log the time and date the connection occured
    bot.user.setActivity("with Twitch API", {type: "PLAYING"});//Set the bot status message in discord
});

bot.on("message", async message => {
    if(message.author.bot) return;//If the message is from the bot, ignore the message
    if(message.channel.type === "dm") return;//If the message is in a direct message, ignore it

    let thisChannel = message.channel.name;//Get current channel command is sent in
    let botChannel = botconfig.botChannel;//Define the bot command channel
    let messageArray = message.content.split(" ");//Create array from message sent in chat
    let cmd = messageArray[0].slice(1);//Grab the command from the array
    let args = messageArray[1];//Grab the argument from the array

    if(message.content.startsWith(botconfig.prefix))
    {
        if(thisChannel !== botChannel)return message.delete();
        
        //if the command is the /join command in discord
        if(cmd === "join")
        {
            var sender = message.member.user;
            var chn = args;
            var file = `./${botconfig.CHAN_DIR}/${chn}.${botconfig.jsonExt}`;

            //Check to see if the channel file exists
            if(fs.existsSync(file) === false)
            {
                //If the channel file does not exist, create it and have the bot join the channel
                fsextra.ensureFile(file).then(() => {
                    //Join the twitch channel
                    client.join(`#${chn}`).then((data) => {}).catch((err) => {console.log(`JOIN Error: ${err} | ${chn}`);});
                    //Tell the user the bot has joined the twitch channel
                    return message.channel.send(`${sender}, ${botconfig.hasJoined} **${chn}**! ${botconfig.modBot}`);
                }).catch(err => {
                    //Log error in console
                    console.log(`ensureFile: ${err}`);
                });
            }
            else
            {
                //If the channel file does exist, tell the user it exists
                return message.channel.send(`${sender}, ${botconfig.alreadyJoined} **${chn}**! ${botconfig.modBot}`);
            }
        }
    }
});

bot.login(botconfig.token);





//////////////////
////TWITCH BOT////
//////////////////
const tmi = require("tmi.js");
const fs = require("fs");
const fsextra = require("fs-extra");
const jsonfile = require("jsonfile");
const twitchFunctions = require(`./functions/twitchfunctions.js`);//Not used at the moment
const channelNames = fs.readdirSync(`./channels/`);
let cNames = [];

//Get each channel file name and remove the file extension then add the name to the array
channelNames.forEach(function(element){
    cNames.push(element.slice(-0,-5));
});

//Define TMI config options
const options = {
    options: {
        clientId: botconfig.clientId,
        debug: botconfig.debug,
    },
    connection: {
        cluster: botconfig.cluster,
        reconnect: botconfig.reconnect,
        maxReconnectInterval: botconfig.maxReconnectInterval,
        reconnectInterval: botconfig.reconnectInterval,
        secure: botconfig.secure,
    },
    identity: {
        username: botconfig.username,
        password: botconfig.password,
    },
    channels: cNames,
}

const client = new tmi.client(options);

client.connect();

client.on("connected", (address, port) => {
    //Logs connection status to channel(s)
    var conChannels = 0;

    for(var i = 0; i < options.channels.length; i++)
    {
        conChannels += 1;
        var chan = options.channels[i];
        console.log(chan, "is connected.");//Log connection status to the console
    }

    console.log(`Connected to ${conChannels} twitch channels.`);//Log the amount of channels connected in console
});

//Triggered upon joining a channel. Gives you the current state of the channel.
client.on("roomstate", (channel, state) => {
    //Check to see if channels json file exists
    var file = `./${botconfig.CHAN_DIR}/${channel.slice(1)}.${botconfig.jsonExt}`;

    fsextra.ensureFile(file).then(() => {
        //
    }).catch(err => {
        console.log(`ensureFile: ${err}`);
    });
});

//Log if the bot disconnects from Twitch
client.on("disconnected", (reason) => {
    for(var i = 0; i < options.channels.length; i++)
    {
        var chan = options.channels[i];
        console.log(chan, botconfig.botDisconnected);
    }
});

//Run on a ban done by a moderator/broadcaster in a twitch channel
client.on("ban", (channel, username, reason, userstate) => {
    let chatBans = botconfig.chatBans;//Define the channel name to submit channel bans to
    let logChannel = bot.channels.find(c => c.name === chatBans);//Get the channel from discord
    var chn = channel.slice(1);//Remove the # from the twitch channel name
    var usrnme = username;//Get the username of the user that was banned

    var file = `./${botconfig.CHAN_DIR}/${channel.slice(1)}.${botconfig.jsonExt}`;//Define the channel file name to be created
    var d = new Date();
    var day = d.getDate();//Get current day
    var month = d.getMonth();//Get current month
    var year = d.getFullYear();//Get current year
    var dte = `${month}-${day}-${year}`;//Combine current day/month/year
    var obj = { name: `${usrnme}`, reason: `${reason}`, date: `${dte}` };//Define what will be put into the channel file

    //Write banned user information to the channel file
    jsonfile.writeFile(file, obj, {flag: "a"}, function (err) {
        if(err)console.error(err);
    });
    
    //Log the banned user in discord
    return logChannel.send("```" + `Banned User\n\nChannel: ${chn}\nUser: ${usrnme}\nDate: ${dte}` + "```");
});