
module.exports = {
    onBan: (channel, username, reason, botconfig, bot, fs, client, jsonfile) => {
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
    },

    onTimeout: (channel, username, reason, duration, botconfig, bot, fs, client, jsonfile) => {
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
    },

    onWhisper: (from, message, self, client) => {
        if(self)return;//If the whisper is from myself, ignore it

        //Send a reply to the user that sent the whisper
        return client.whisper(from, "Uh oh! I'm just a bot! If you are intrested in adding this bot to your twitch channel, please visit us on discord at https://discord.io/rpbot9000").then((data) => {
            // data returns [username, message]
        }).catch((err) => {
            console.log(err);//Log all errors
        });
    },

    onDisconnect: (options) => {
        for(var i = 0; i < options.channels.length; i++)
        {
            var chan = options.channels[i];
            console.log(chan, "RPBot9000 disconnected.");//Log in the console that the bot has disconnected from a twitch channel
        }
    },

    onRoomstate: (channel, fsextra) => {
        //Define the channel file
        var file = `./channels/${channel.slice(1)}.json`;

        //Check to see if channels json file exists
        fsextra.ensureFile(file).then(() => {
            //Nothing needs to be done here
        }).catch(err => {
            return console.log(`ensureFile: ${err}`);
        });
    },

    onConnect: (options) => {
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
    }
}