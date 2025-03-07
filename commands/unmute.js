const { SlashCommandBuilder } = require('@discordjs/builders');
const DiscordJS = require('discord.js');
const mysql = require('mysql2'); 
const config = require('../databaseConfig');
const connection = config.connection;

const rejected = new DiscordJS.MessageEmbed()
            .setColor('#b8e4fd')
            .setTitle('Unable to take action')
            .setDescription(`<:shelbyFailure:911377751548755990> **| Action cannot be taken as my highest role isn't higher than the target's highest role. |** `)

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Unmutes a user.')
        .setDefaultPermission(false)
        .addUserOption(option => 
            option.setName('user')
                    .setDescription('The user to unmute.')
                    .setRequired(true))
        .addStringOption(option => 
            option.setName('reason')
                    .setDescription('Reason for the unmute.')
                    .setRequired(false)),
    async execute(client, interaction) {
        const perm_bot_error_embed = new DiscordJS.MessageEmbed()
                .setTitle(`Error`)
                .setDescription(`<:shelbyFailure:911377751548755990> **| Please make sure I have the \`Manage Roles\` permission before executing this command! |** `)
                .setColor('#b8e4fd')

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
        const muteRole = interaction.guild.roles.cache.find(role => role.name == 'Muted');
        const guildID = interaction.guildId;
        const pfp = memberTarger.displayAvatarURL();

        const embed = new DiscordJS.MessageEmbed()
                .setColor('#b8e4fd')
                .setAuthor({ name: 'Member unmuted', iconURL: `https://cdn.discordapp.com/avatars/898229527761788990/9045f776607eee7e0bfea538434ea8af.webp` })
                .setDescription(`<:shelbySuccess:911377269640028180> **| ${memberTarger} has been unmuted: ${reasonTarger} |**`)

        const alreadyUnmuted = new DiscordJS.MessageEmbed()
                .setColor('#b8e4fd')
                .setDescription(`<:shelbyFailure:911377751548755990> **| This member is already unmuted. |** `)

        if (memberTarger.roles.cache.has(muteRole.id)) {

        await memberTarger.roles.remove(muteRole.id);

        connection.execute(`SELECT log_channel_id FROM configuration WHERE guild_id=?`, [guildID], function (err, result) {
            if (err) { throw err; };
            
            if(result == null) { 
            const logReject = new DiscordJS.MessageEmbed()
                    .setColor('#b8e4fd')
                    .setTitle('Unable to log action')
                    .setDescription(`<:shelbyFailure:911377751548755990> **| Action cannot be logged as there has been no logging channel found. |** ❌`)

                interaction.followUp({
                    embeds: [logReject],
                    ephemeral: true
                });
            } else {  
                const logEmbed = new DiscordJS.MessageEmbed()
                    .setColor('#b8e4fd')
                    .setAuthor({ name: `${memberTarger.user.tag} was unmuted`, iconURL: `${pfp}` })
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
        } else {
            interaction.editReply({
                embeds: [alreadyUnmuted],
                ephemeral: true,
                    });
                };
            } catch (err) {
                const rolesErrorEmbed = new DiscordJS.MessageEmbed()
                    .setTitle(`Error`)
                    .setDescription(`<:shelbyFailure:911377751548755990> **| Please make sure my highest role is above the \`Muted\` role before executing this command! |** `)
                    .setColor('#b8e4fd')
    
                interaction.editReply({
                    embeds: [rolesErrorEmbed],
                    ephemeral: true,
                });
            };
        };
    },
};