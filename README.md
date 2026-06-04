§§Note-----The plugin works on Illustrator 2022 and above§§
Installing the Guidr plugin:
- After downloading the plugin, go to the file and unzip it
- Move the contents of the file to this location
"C:Program Files/(x86)Common Files/Adobe/CEP/extensions"

**If the CEP folder does not exist, you can create it and inside it another folder named extensions

- After moving the contents of the compressed file, go to Cmd and paste the following commands //one by one

reg add "HKEY_CURRENT_USERSoftwareAdobeCSXS.10" /v PlayerDebugMode /t REG_SZ /d 1 /f

and press Enter

reg add "HKEY_CURRENT_USERSoftwareAdobeCSXS.11" /v PlayerDebugMode /t REG_SZ /d 1 /f

and press Enter

reg add "HKEY_CURRENT_USERSoftwareAdobeCSXS.12" /v PlayerDebugMode /t REG_SZ /d 1 /f

and press Enter

After that, run Illustrator, and if it is open, restart it and you will find that the plugin is available

Window > Extension > Guidr
