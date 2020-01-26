
module.exports = {
    blankFunction: () => {
        //
    },

    generateCode: (numbers) => {
        var rand = Math.random(9);
        var code = "";

        for (var i = 0; i < numbers; i++)
        {
            var rand = Math.floor(Math.random() * 10);
            code += rand;
        }

        var res = code.split('').sort(function(){return 0.5-Math.random()}).join('');

        return res;
    },

    verifyChannel: (args, message, fs, fsextra, jsonfile, client) => {
        var sender = message.member.user;//Get the sender name of the command

        if(args === null || args === "" || !args)
        {
            message.channel.send(`${sender}, To verify your channel please use ``/verify VerificationCode`` `);
            return message.delete();
        }

        var file = `./code/${args}.json`;//Define the channel file name

        if(fs.existsSync(file) === true)
        {
            var contents = JSON.stringify(jsonfile.readFileSync(file));
            var contents = JSON.parse(contents);
            var code = args;//Get the channel name from the command
            var codeVerified = null;
            var type = contents.type;
            var chn = contents.channel;

            if(code === contents.code)
            {
                //Delete the code file for the channel
                fs.unlink(file, (err) => {
                    if(err)return console.log(err);
                });

                codeVerified = true;
            }
            else
            {
                codeVerified = false;
                return message.channel.send(`${sender}, the code you entered is incorrect. Please check the code and try again.`);
            }
        }
        else
        {
            return message.channel.send(`${sender}, I'm sorry but I can't seem to find that verification code.`);
        }

        if(codeVerified === true)
        {
            var file = `./channels/${chn}.json`;//Define the channel file name

            if(type === "join")
            {
                //Check to see if the channel file exists
                if(fs.existsSync(file) === false)
                {
                    //If the channel file does not exist, create it and have the bot join the channel
                    fsextra.ensureFile(file).then(() => {
                        //Join the twitch channel
                        client.join(`#${chn}`).then((data) => {
                            //Tell the user the bot has joined the twitch channel
                            return message.channel.send(`${sender}, RPBot9000 is joining channel **${chn}**! Please give the bot a few minutes to join this channel. Please /mod RPBot9000 to ensure the bot does not get banned.`);
                        }).catch((err) => {return console.log(`JOIN Error: ${err} | ${chn}`);});
                    }).catch(err => {
                        //Log error in console
                        return console.log(`ensureFile: ${err}`);
                    });
                }
                else
                {
                    //If the channel file does exist, tell the user it exists
                    return message.channel.send(`${sender}, RPBot9000 is already in channel **${chn}**! Please /mod RPBot9000 to ensure the bot does not get banned.`);
                }
            }

            if(type === "leave")
            {
                //Check to see if the channel file exists
                if(fs.existsSync(file) === true)
                {
                    //If the channel file does not exist, create it and have the bot join the channel
                    fsextra.remove(file).then(() => {
                        //Join the twitch channel
                        client.part(`#${chn}`).then((data) => {return message.channel.send(`${sender}, RPBot9000 has left channel **${chn}**!`);}).catch((err) => {return console.log(`LEAVE Error: ${err} | ${chn}`);});
                    })
                    .catch(err => {
                        //Log error in console
                        return console.log(`ensureFile: ${err}`);
                    });
                }
                else
                {
                    //If the channel file does exist, tell the user it exists
                    return message.channel.send(`${sender}, RPBot9000 is not in channel **${chn}**!`);
                }
            }
        }
    },

    joinChannel: (args, message, fs, client, jsonfile, code) => {
        if(args === null || args === "" || !args)
        {
            message.channel.send("To have the bot join your channel please use ``/join ChannelName``");
            return message.delete();
        }

        var sender = message.member.user;//Get the sender name of the command
        var senderID = message.member.id;//Get the discord user id
        var senderTag = message.member.user.tag;//Get the discord user id
        var chn = args;//Get the channel name from the command
        var code = code;//Generate a random 6 digit code
        var file = `./code/${code}.json`;//Define the code file name for the channel
        var obj = { code: `${code}`, channel: `${chn}`, discordID: `${senderID}`, discordName: `${senderTag}`, type: `join` };//Define what will be put into the verification code file
        var canContinue = null;

        if(fs.existsSync(file) === false)
        {
            //Write verification code and channel name to file
            jsonfile.writeFile(file, obj, {flag: "a"}, function (err) {
                if(err)return console.error(err);
            });

            //Set canContinue to true after data has been written to file
            canContinue = true;
        }
        else
        {
            canContinue = false;
            return message.channel.send(`I'm sorry ${sender}, you have already requested a code. Please check your whispers on Twitch to retrieve the code.`);
        }

        if(canContinue)
        {
            client.whisper(`${chn}`, `Your verification code is: ${code}`).then((data) => {
                /*data returns [username, message]*/
                return message.channel.send(`${sender}, A whisper has been sent to **${data[0]}** on Twitch, please use !verify with the code sent to you.`);
            }).catch((err) => {
                return console.log(`WHISPER Error: ${err} | ${chn}`);
            });
        }
    },

    leaveChannel: (args, message, fs, client, jsonfile, code) => {
        if(args === null || args === "" || !args)
        {
            message.channel.send("To have the bot leave your channel, please use ``/leave ChannelName``");
            return message.delete();
        }

        var sender = message.member.user;//Get the sender name of the command
        var senderID = message.member.id;//Get the discord user id
        var senderTag = message.member.user.tag;//Get the discord user id
        var chn = args;//Get the channel name from the command
        var code = code;//Generate a random 6 digit code
        var file = `./code/${code}.json`;//Define the code file name for the channel
        var obj = { code: `${code}`, channel: `${chn}`, user: `${senderID}`, discordName: `${senderTag}`, type: `leave` };//Define what will be put into the verification code file
        var canContinue = null;

        if(fs.existsSync(file) === false)
        {
            //Write verification code and channel name to file
            jsonfile.writeFile(file, obj, {flag: "a"}, function (err) {
                if(err)return console.error(err);
            });

            //Set canContinue to true after data has been written to file
            canContinue = true;
        }
        else
        {
            canContinue = false;
            return message.channel.send(`I'm sorry ${sender}, you have already requested a code. Please check your whispers on Twitch to retrieve the code.`);
        }

        if(canContinue)
        {
            client.whisper(`${chn}`, `Your verification code is: ${code}`).then((data) => {
                /*data returns [username, message]*/
                return message.channel.send(`${sender}, A whisper has been sent to **${data[0]}** on Twitch, please use /verify with the code sent to you.`);
            }).catch((err) => {
                return console.log(`WHISPER Error: ${err} | ${chn}`);
            });
        }
    },

    banCount: (args, message, fs) => {
        if(args === null || args === "" || !args)
        {
            message.channel.send("Please include the Twitch channel name. ``/bans ChannelName``");
            return message.delete();
        }

        var sender = message.member.user;//Get the sender name of the command
        var canContinue = null;
        var chn = args;
        var file = `./channels/${chn}.json`;//Define the channel file name

        //Make sure channel file exist
        if(fs.existsSync(file) === true)
        {
            canContinue = true;
        }
        else//If channel file does not exist
        {
            canContinue = false;
            return message.channel.send(`I'm sorry ${sender}, it appears I don't monitor that channel.`);
        }

        if(canContinue)
        {
            //Count number of lines in channel file
            fs.readFile(file, 'utf8', (err, data) => {
                var banCount = data.split('\n').length;
                //Display ban count in chat
                return message.channel.send(`A total of **${banCount}** bans have been recorded in **${chn}**.`);
            });
        }
    },

    checkBanned: (fs, path, message, args) => {
        if(args === null || args === "" || !args)
        {
            message.channel.send("Please use ``/banned TwitchName``");
            return message.delete();
        }

        var userName = args;
        var bannedChannels = new Array();

        function searchFilesInDirectory(dir, filter, ext) {
            if (!fs.existsSync(dir)) {
                console.log(`Specified directory: ${dir} does not exist`);
                return;
            }
        
            const files = getFilesInDirectory(dir, ext);
        
            files.forEach(file => {
                const fileContent = fs.readFileSync(file);
        
                // We want full words, so we use full word boundary in regex.
                const regex = new RegExp('\\b' + filter + '\\b');
                if (regex.test(fileContent)) {
                    file = file.slice(9, -5);
                    bannedChannels.push(file);
                }
            });
        }

        function getFilesInDirectory(dir, ext) {
            if (!fs.existsSync(dir)) {
                console.log(`Specified directory: ${dir} does not exist`);
                return;
            }
        
            let files = [];
            fs.readdirSync(dir).forEach(file => {
                const filePath = path.join(dir, file);
                const stat = fs.lstatSync(filePath);
        
                // If we hit a directory, apply our function to that dir. If we hit a file, add it to the array of files.
                if (stat.isDirectory()) {
                    const nestedFiles = getFilesInDirectory(filePath, ext);
                    files = files.concat(nestedFiles);
                } else {
                    if (path.extname(file) === ext) {
                        files.push(filePath);
                    }
                }
            });
        
            return files;
        }

        searchFilesInDirectory("./channels/", userName, ".json");
        var channelNames = "";

        for(var n = 0; n < bannedChannels.length; n++)
        {
            //
            channelNames += `**${bannedChannels[n]}**\n`;
        }

        if(channelNames.length > 0)
        {
            return message.channel.send(`*__${userName}__* is currently banned in the following channels:\n${channelNames}`);
        }
        else
        {
            return message.channel.send(`*__${userName}__* is currently not banned in any channel.`);
        }
    },

    getUserMessages: (args, fs, message, sender) => {
        //
        if(!args || args === "" || args === undefined || args === null)return message.channel.send(`${sender}, Please include a Twitch username. Example: /history therealgravvy`);
        var file = `./users/${args}.txt`;
        readLastLines = require('read-last-lines');

        if(fs.existsSync(file) === true)
        {
            //Get the last 25 lines from the user file
            readLastLines.read(file, 25).then((lines) =>{
                return message.channel.send(`Last 25 messages from __${args}__` + "```" + lines + "```");
            }).catch((err) => {
                console.log(err);
            });
        }
        else
        {
            return message.channel.send(`${sender}, Sorry that user does not exist in our database yet.`);
        }
    }
}