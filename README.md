# LangLines

LangLines is an HTML5 game developed with the GameSnacks SDK which helps you to improve your vocabulary.  
Play here https://crowne.github.io/langlines/  
I am testing this to learn about getting a google play store listing as an instant app for android playstore.

## How to play

The game is simple, in the settings you choose 2 languages : home and foreign.

Each round of the game lasts 3 minutes.  
At the start of the round an 8x8 grid of letters is shown.  
You have to find words in the grid at least 3 letters long.  
Each letter used will score 1 point.  
Each round will include 2 random letters tiles marked as triple word score tiles and 3 random letter tiles marked as double word score tiles.  
The word may be read horizontally, vertically, diagonally or backwards.  
You can find words in both languages.  
When a word is found an information panel above the grid will show the translation of the word.  
Letters used will disappear and tiles a used letter will fall down to fill the gap.  
When all the letters of a column are used the columns to its left will move one position to the right.  
The round ends when the time is over or when all the letters are used.  
At the end of the round the player will be shown the words found with their translations and meanings and the score.  
Each round has a target number of lines to clear, where a line could be a row or column.  
If the target is reached then the next round can be started else the game will end.

## distribution

The game will be available on the google play store as an instant app with no installation required.  
The game should be playable in offline mode.

## See
https://crowne.github.io/langlines/  
https://developers.google.com/gamesnacks/developer/sdk  
https://dle.rae.es/diccionario

## TODO
Remove diacritic chars from es dictionary keys except for Ñ
