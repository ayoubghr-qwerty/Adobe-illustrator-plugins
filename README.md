# Adobe-illustrator-plugins
Cep adobe illustrator plugins 

================================================================
  GUIDR — CEP Plugin Installation Guide
  Adobe Illustrator CC 2020 and later
================================================================

STEP 1 — ENABLE DEBUG MODE (required for unsigned plugins)
----------------------------------------------------------

Adobe blocks unsigned CEP extensions by default.
You must enable PlayerDebugMode BEFORE installing the plugin.

[ WINDOWS ]

  Open Command Prompt as Administrator, then run:

  For Illustrator 2020–2025 (CEP 9 to 11), run ALL of these:

    reg add "HKEY_CURRENT_USER\SOFTWARE\Adobe\CSXS.9"  /v PlayerDebugMode /t REG_SZ /d 1 /f
    reg add "HKEY_CURRENT_USER\SOFTWARE\Adobe\CSXS.10" /v PlayerDebugMode /t REG_SZ /d 1 /f
    reg add "HKEY_CURRENT_USER\SOFTWARE\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d 1 /f

  Running all three ensures compatibility regardless of your exact version.

  To verify it worked, open Registry Editor (regedit) and navigate to:
    HKEY_CURRENT_USER > SOFTWARE > Adobe > CSXS.11
  You should see PlayerDebugMode = 1

[ MAC ]

  Open Terminal and run:

    defaults write com.adobe.CSXS.9  PlayerDebugMode 1
    defaults write com.adobe.CSXS.10 PlayerDebugMode 1
    defaults write com.adobe.CSXS.11 PlayerDebugMode 1

  To verify:
    defaults read com.adobe.CSXS.11 PlayerDebugMode
  Should return: 1


STEP 2 — INSTALL THE PLUGIN
----------------------------------------------------------

Copy the "Guidr" plugin folder to the CEP extensions directory.

  [ WINDOWS — current user only ]
    C:\Users\YOUR_USERNAME\AppData\Roaming\Adobe\CEP\extensions\

  [ WINDOWS — all users on this machine ]
    C:\Program Files\Common Files\Adobe\CEP\extensions\

  [ MAC — current user only ]
    ~/Library/Application Support/Adobe/CEP/extensions/

  [ MAC — all users on this machine ]
    /Library/Application Support/Adobe/CEP/extensions/

  NOTE: The AppData folder is hidden on Windows.
  To access it: press Win+R, type %appdata%, press Enter.
  Then navigate to Adobe > CEP > extensions.

  If the "CEP" or "extensions" folder doesn't exist, create it manually.

  Final structure should look like this:
    extensions/
    └── Guidr/
        ├── manifest.xml
        ├── index.html
        └── ... (other plugin files)


STEP 3 — LAUNCH THE PANEL IN ILLUSTRATOR
----------------------------------------------------------

  1. Close Illustrator completely if it was open.
  2. Reopen Illustrator.
  3. Go to:  Window > Extensions > Guidr

  If Guidr doesn't appear in the menu:
    - Double-check the folder is named exactly "Guidr" (case-sensitive on Mac)
    - Confirm PlayerDebugMode is set to 1 (Step 1)
    - Confirm the folder contains a valid manifest.xml
    - Restart Illustrator


STEP 4 — DISABLE DEBUG MODE AFTER INSTALL (optional)
----------------------------------------------------------

  Once the plugin is working, you can leave debug mode on — it causes
  no issues. If you prefer to disable it:

  [ WINDOWS ]
    reg add "HKEY_CURRENT_USER\SOFTWARE\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d 0 /f

  [ MAC ]
    defaults write com.adobe.CSXS.11 PlayerDebugMode 0


================================================================
  ILLUSTRATOR VERSION → CEP VERSION REFERENCE
================================================================

  Illustrator 2020 (v24.x)  →  CEP 9   →  CSXS.9
  Illustrator 2021 (v25.x)  →  CEP 10  →  CSXS.10
  Illustrator 2022 (v26.x)  →  CEP 11  →  CSXS.11
  Illustrator 2023 (v27.x)  →  CEP 11  →  CSXS.11
  Illustrator 2024 (v28.x)  →  CEP 11  →  CSXS.11
  Illustrator 2025 (v29.x)  →  CEP 11  →  CSXS.11


================================================================
  TROUBLESHOOTING
================================================================

  Panel shows but looks blank / broken
    → Right-click inside the panel > select "Reload"
    → Or open Chrome debug console:
       Go to http://localhost:PORT in Chrome while Illustrator is open
       (PORT is defined in your manifest.xml <Resources> tag)

  "Extension is not compatible with this product"
    → Check that the manifest.xml HostList matches your Illustrator version
    → The <Host Name="ILST" Version="[24.0,99.9]" /> range must include your version

  Mac: panel appears but immediately disappears
    → Go to System Settings > Privacy & Security
    → Allow the extension if it was blocked

  Windows: registry key disappears after restart
    → Reapply the reg add command — some Windows configurations reset it


================================================================
  NEED HELP?
================================================================

  Contact DigiTa:
  Facebook / TikTok / Pinterest: @DigiTa

================================================================

