Welcome to Hold'em Bot!

Check out the commands below to begin!
If you have any issues please submit them [here](${packageFile.bugs.url}).

---------------

**$create** _(Channel Only)_  
Create a Hold'em table in the current channel.

**--min-buy-in <number>**  
Specify a minimum buy-in amount for the table.  
**--no-sound**  
Disable sound effects for this table.  
**--small-blind <number>**  
Specify the amount of the small blind.  
**--big-blind <number>**  
Specify the amount of the big blind.  
**--buy-in <number>**  
Specify the amount you, as the creator, intend to bring to the table.  
**--reset**  
Create a new table and override any existing table.  

---------------

**$deal** _(DM or Channel)_  
Deal the cards and begin the hand!

The table creator or the player in the dealer position can run this command. 

Once a hand has begun all seated players will receive a private message from Hold'em Bot. This message is where the entire hand and betting will take place. This way you can see your hole cards and don't have to flip back and forth between the private message and the channel <:awesome:708028362488021092>

---------------

**$sit [seat] [buy-in]** _(Channel Only)_  
Take a seat at the active Hold'em table.

**--seat <number>**  
Specify which seat you'd like to take at the table.  
**--buy-in <number>**  
Specify the amount of money to bring to the table. Defaults to the minimum buy-in for the table.  

---------------

**$stand** _(DM or Channel)_  
Stand up from your current table.

---------------

**$refresh** _(DM or Channel)_  
Refresh the current table. Useful if the table has been scrolled out of view by chatter.

---------------

**$destroy** _(DM or Channel)_  
Destroy the current table. This command can only be issued by the table creator.