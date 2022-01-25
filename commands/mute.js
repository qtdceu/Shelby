const { SlashCommandBuilder } = require('@discordjs/builders');
const DiscordJS = require('discord.js');
const ms = require('ms');
const mysql = require('mysql2'); 
const config = require('../databaseConfig');
const connection = config.connection;

const rejected = new DiscordJS.MessageEmbed()
            .setColor('#2f3136')
            .setTitle('Unable to take action')
            .setDescription(`<:shelbyFailure:908851692408283136> **| Action cannot be taken as my highest role isn't higher than the target's highest role. |** `)

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mutes a user.')
        .setDefaultPermission(false)
        .addUserOption(option => 
            option.setName('user')
                    .setDescription('The user to mute.')
                    .setRequired(true))
        .addStringOption(option => 
            option.setName('reason')
                    .setDescription('Reason for the mute.')
                    .setRequired(false))
        .addStringOption(option => 
            option.setName('time')
                    .setDescription('Time for the mute to last.')
                    .setRequired(false)),
    async execute(client, interaction) {
        const perm_bot_error_embed = new DiscordJS.MessageEmbed()
                .setTitle(`Error`)
                .setDescription(`<:shelbyFailure:908851692408283136> **| Please make sure I have the \`Manage Roles\` permission before executing this command! |** `)
                .setColor('#2f3136')

        if (!interaction.guild.me.permissions.has(`MANAGE_ROLES`)) {
            interaction.reply({
                embeds: [perm_bot_error_embed],
                ephemeral: true,
            });
        } else {
            try {

        await interaction.deferReply({ ephemeral: true });

        const memberTarger = interaction.options.getMember('user');
        const reasonTarger = interaction.options.getString('reason') || 'No reason provided.';
        const guildID = interaction.guildId;
        const timeTarger = interaction.options.getString('time'); 
        const pfp = memberTarger.displayAvatarURL();
        const muteRole = interaction.guild.roles.cache.find(role => role.name === 'Muted');
        console.log(interaction.commandId);

        if (muteRole === undefined) {
            interaction.guild.roles.create({
                name: 'Muted',
                permissions: [],
                color: "#000000",
            })
        }

        const embed = new DiscordJS.MessageEmbed()
                .setColor('#2f3136')
                .setAuthor({ name: 'Member muted', iconURL: `https://cdn.discordapp.com/avatars/898229527761788990/9045f776607eee7e0bfea538434ea8af.webp` })
                .setDescription(`<:shelbySuccess:908788558305820713> **| ${memberTarger} has been muted: ${reasonTarger} |**`)

        const actionTaken = new DiscordJS.MessageEmbed()
                .setColor('#2f3136')
                .setDescription(`<:shelbySuccess:908788558305820713> **| You have been muted in ${interaction.guild.name} for: ${reasonTarger} |** `)

        const alreadyMuted = new DiscordJS.MessageEmbed()
                .setColor('#2f3136')
                .setDescription(`<:shelbyFailure:908851692408283136> **| This member is already muted. |** `)

        if (!memberTarger.roles.cache.has(muteRole.id)) {

        if (!timeTarger) {
            await memberTarger.roles.add(muteRole.id);

            memberTarger.send({ embeds: [actionTaken] }).catch(() => {
                return;
            });

            connection.execute(`SELECT log_channel_id FROM configuration WHERE guild_id=?`, [guildID], function (err, result) {
                if (err) { throw err; };
                console.log(result);
        
                if(result == null) { 
                const logReject = new DiscordJS.MessageEmbed()
                        .setColor('#2f3136')
                        .setTitle('Unable to log action')
                        .setDescription(`<:shelbyFailure:908851692408283136> **| Action cannot be logged as there has been no logging channel found. |** ❌`)
    
                    interaction.followUp({
                        embeds: [logReject],
                        ephemeral: true
                    });
                } else {  
                    const logEmbed = new DiscordJS.MessageEmbed()
                        .setColor('#b8e4fd')
                        .setAuthor({ name: `${memberTarger.user.tag} was muted`, iconURL: `${pfp}`})
                        .addField(`Invoker`, `${interaction.member} / \`${interaction.user.tag}\``, true)
                        .addField(`Target`, `${memberTarger} / \`${memberTarger.id}\``, true)
                        .addField(`Reason`, `${reasonTarger}`, true)
                        .setTimestamp()
            
            
                    const channel = client.channels.cache.get(result[0].log_channel_id.toString());
                    channel.send({embeds:[logEmbed]});
                };
            });

            interaction.editReply({
                embeds: [embed],
                ephemeral: true,
            });
            return;
        } 
        await memberTarger.roles.add(muteRole.id);

        memberTarger.send({ embeds: [actionTaken] }).catch(() => {
            return;
        });

        connection.execute(`SELECT log_channel_id FROM configuration WHERE guild_id=?`, [guildID], function (err, result) {
            if (err) { throw err; };
            console.log(result);
    
            if(result == null) { 
            const logReject = new DiscordJS.MessageEmbed()
                    .setColor('#2f3136')
                    .setTitle('Unable to log action')
                    .setDescription(`<:shelbyFailure:908851692408283136> **| Action cannot be logged as there has been no logging channel found. |** ❌`)

                interaction.followUp({
                    embeds: [logReject],
                    ephemeral: true
                });
            } else {  
                const logEmbed = new DiscordJS.MessageEmbed()
                    .setColor('#b8e4fd')
                    .setAuthor({ name: `${memberTarger.user.tag} was muted`, iconURL: `${pfp}` })
                    .addField(`Invoker`, `${interaction.member} / \`${interaction.user.tag}\``, true)
                    .addField(`Target`, `${memberTarger} / \`${memberTarger.id}\``, true)
                    .addField(`Reason`, `${reasonTarger}`, true)
                    .addField(`Time`, `${timeTarger}`, true)
                    .setTimestamp()
        
        
                const channel = client.channels.cache.get(result[0].log_channel_id.toString());
                channel.send({embeds:[logEmbed]});
            };
        });

        interaction.editReply({
            embeds: [embed],
            ephemeral: true,
        });

        setTimeout(async () => {
            await memberTarger.roles.remove(muteRole.id);
        }, ms(timeTarger));
    } else {
            interaction.editReply({
                embeds: [alreadyMuted],
                ephemeral: true,
                    });
                };
            } catch (error) {
                const rolesErrorEmbed = new DiscordJS.MessageEmbed()
                    .setTitle(`Error`)
                    .setDescription(`<:shelbyFailure:908851692408283136> **| Please make sure my highest role is above the \`Muted\` role before executing this command! |** `)
                    .setColor('#2f3136')
    
                interaction.editReply({
                    embeds: [rolesErrorEmbed],
                    ephemeral: true,
                });
            };
        };
    },
};