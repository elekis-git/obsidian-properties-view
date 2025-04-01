import subprocess
import time
import pytest
import pyautogui
import os

# URI Obsidian pour ouvrir un vault spécifique et un fichier spécifique
def open_obsidian_with_uri(vault_name, file_name):
    # Crée l'URI pour ouvrir Obsidian avec le vault et un fichier spécifiques
    obsidian_uri = f"obsidian://open?vault={vault_name}"
    
    # Exécute la commande pour ouvrir Obsidian avec l'URI
    subprocess.Popen(["flatpak", "run", "md.obsidian.Obsidian", obsidian_uri])
    time.sleep(5)



def test_open_obsidian_with_uri():
    # Ouvre Obsidian avec le vault et le fichier spécifié via l'URI
    open_obsidian_with_uri("obsidianPlug", "Welcome")

    try:
        screenshot = pyautogui.screenshot(region=(100, 100, 400, 300))

        if pyautogui.locateOnScreen("image_attendue.png", confidence=0.8):
            print("✅ Obsidian lancé avec succès !")
        else:
            print("❌ Obsidian ne s'est pas ouvert correctement.")
    except Exception as e:
        print(f"❌ Erreur pendant le test : {e}")

    pyautogui.hotkey('alt', 'f4')
