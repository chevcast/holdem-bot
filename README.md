# Welcome to Hold'em Bot!

Check out the commands below to begin!  
If you'd like to find people to play with, check out the Hold'em Bot discord server: https://discord.gg/TGzd9T3

If you have any issues please submit them [here](https://github.com/chevtek/holdem-bot/issues).

## Getting Started

Setting up Hold'em Bot is easy. Here are the quickest steps to starting a quick game!

1. [Invite Hold'em Bot to your server](https://discord.com/oauth2/authorize?client_id=751205317554995211&permissions=37092416&scope=bot).
2. In a channel visible to Hold'em Bot simply type `$create`. This will create and render a default cash table in the channel.  
    ![](https://i.imgur.com/7U1lp7e.png)
3. Have additional players type `$sit` to take a seat at the table. The table will re-render to show the new players.  
    ![](https://i.imgur.com/fWGN1kK.png)
4. Once you have two or more players you can type `$deal` to begin the first hand. The table in channel will re-render to show the blinds being posted but it will also DM each player a render of the table that shows them their own cards.  
    ![](https://i.imgur.com/wRzfugI.png)
5. The game will then ask the active player what they would like to do. This takes place in the DM from the bot. The entire hand is played from the DM so you can see your cards and don't have to keep switching back and forth between DM and channel. When it's your turn your name will light up green and the Hold'em Bot post will have a green bar on the left side.  
    ![](https://i.imgur.com/Kz0cw1U.png)
6. The game will continue asking for input from players until the hand has completed.  
    ![](https://i.imgur.com/2Ddsc93.png)
7. The game will notify who the next dealer is and prompt them to type `$deal` to begin a new hand.

## F.A.Q.

### **Do I have to go back to the channel to chat with the other players via text?**  
Nope! Players can type into the channel or the DM where they are playing a hand and the message will be relayed to the other players' DMs as well as the channel where the game started. Even messages from people watching the game in-channel wil be relayed to the players and vice versa. This makes it easy to communicate via text while playing!

### **Is there a "party leader" of some kind?**  
Yes. The creator of the table is the table _owner_. If that player leaves then the owner will be passed to someone else and it will notify who the new owner is. The owner can run the `$deal` command even if they are not the dealer. If all players leave (`$stand`) then the table will be destroyed automatically.

### **I heard there were sound effects, how do they work?**  
If the table owner is in a voice channel that is visible to the bot then the bot will join that channel and play sound effects for the game! To disable this behavior pass the `--no-sound` flag when creating a new table (e.g. `$create --no-sound`).

### **The bot isn't responding to my replies to its prompts. Help!**  
It's rare but on occasion the server may restart due to us pushing out new versions, internet hiccups, etc. Usually these are very brief restarts and the bot is responsive again right away. However one side-effect of these restarts is that any active Discord "listeners" (prompts) are destroyed. But not to worry! Any player in the game can simply run `$refresh` and the bot will refresh the table and restore game state, including re-prompting the user(s) for any actions :)

### **I can't create a table in my channel because one exists already but nobody is there!**  
By default if the table has been idle for 15 minutes then the table will be destroyed automatically. However this can be disabled and a table can be left idle in a channel. Users can issue the `$destroy` command in channel to destroy it and start fresh. Be really sure that you want to do this though. If people were planning to come back to their game then they will have to start fresh.

### **Do I get to keep my winnings?**  
You do! You have a default bankroll of **$3,000**. If you go bankrupt then it will automatically grant you another $3,000. To view your bankroll simply type `$bank`. Your bankroll is tied to the server you are in. The `$bank` command will show you all your bankrolls on all the servers where you play. You can also issue the `$leaderboard` command to see how your stack compares to others on the server!

### **What happens to my money if the table is destroyed?**  
Whatever is remaining of the money you brought to the table with you will be returned to your bankroll when you `$stand`, get kicked, or the table is destroyed. Money you have in front of you as a bet, money you have placed in the pot, or money that you have ultimately given to other players as winnings is lost to you when you stand or get kicked.

### **Is there a tournament mode?**
Yes! Simply pass `--tournament` or `-t` for short when issuing the `$create` command. This will create a new table in tournament mode. Players will only be able to buy-in to this table for the minimum buy-in and no more than that (default $1,000). After the first hand has begun no more players will be allowed to join the table. Also, starting a table in tournament mode will activate a default blind increase timer of 30 minutes. Every time the timer is up the blinds will double.

# Commands

### **`$bankroll, $bank [user]`** _(DM or Channel)_

Show a user's bankrolls.

#### Options:
#### `--user <@mention>`
@mention a user to show their bankrolls. Defaults to yourself if no user is mentioned.

---------------

### **`$create`** _(Channel Only)_

Create a Hold'em table in the current channel.

#### Options:
#### `--min-buy-in <number>`
Specify a minimum buy-in amount for the table. Default is $1000.
#### `--tournament, -t`
Specifies the table is a tournament table. Disables joins after the first hand has begun and enforces minimum buy-in only.
#### `--blind-increase-timer <number>`
How often (in minutes) the blinds should double. 0 to disable. Default is 0 for cash tables and 30 for tournament tables.
#### `--no-sound`
Disable sound effects for this table.
#### `--small-blind <number>`
Specify the amount of the small blind. Default is $10.
#### `--big-blind <number>`
Specify the amount of the big blind. Default is $20.
#### `--buy-in <number>`
Specify the amount you, as the creator, intend to bring to the table. Default is the table minimum buy-in.
#### `--turn-timer <number>`
The number of seconds a player has to act on their turn. Default is 45 seconds. Specify 0 to disable turn timers.
#### `--auto-destruct-timer <number>`
The number of minutes before an idle table self-destructs. Defaults to 15 minutes.
#### `--reset`
Create a new table and override any existing table.

---------------

### **`$deal, $d`** _(DM or Channel)_

Deal the cards and begin the hand! The table creator or the player in the dealer position can run this command.

---------------

### **`$sit, $s [seat] [buy-in]`** _(Channel Only)_
Take a seat at the active Hold'em table.
#### `--seat <number>`
Specify which seat you'd like to take at the table.
#### `--buy-in <number>`
Specify the amount of money to bring to the table. Defaults to the minimum buy-in for the table.

---------------

### **`$stand [user]`** _(DM or Channel)_

Stand up from your current table. If you are the table owner you can optionally specify a user to forcibly remove them.

#### `--user <@mention>`
@mention a user to remove that user from the table. Only allowed if you're the table owner.

---------------

### **`$leaderboard, $lb`** _(Channel Only)_

Display a list of all player bankrolls for this server.

---------------

### **`$hands`** _(DM or Channel)_

Show poker hand rankings guide.

---------------

### **`$terms`** _(DM or Channel)_

Display a glossary of poker terminology.

---------------

### **`$refresh, $r`** _(DM or Channel)_

Refresh the current table. Useful if the table has been scrolled out of view by chatter.

---------------

### **`$destroy`** _(Channel Only)_

Destroy the current table. This command can only be issued by the table creator.