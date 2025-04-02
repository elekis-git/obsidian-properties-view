import os
import pyautogui
import time
import subprocess

def open_obsidian_with_uri(vault_name):
    #le vault doit deja etre créé, 
    obsidian_uri = f"obsidian://open?vault={vault_name}"
    subprocess.Popen(["flatpak", "run", "md.obsidian.Obsidian", obsidian_uri], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1)  # Attend que la fenêtre soit bien chargée


def click_community_plugins():
    try :
        image_path = "community2.png"  # Chemin vers l'image de l'onglet
        location = pyautogui.locateCenterOnScreen(image_path, confidence=0.8)
        pyautogui.moveTo(location, duration=0.5)
        pyautogui.click()
        print("Onglet 'Plugins communautaires - img1' trouvé et cliqué!")
        return
    except pyautogui.ImageNotFoundException:
        print("Onglet 'Plugins communautaires - img1' non trouvé. start with img2")    

    try:
        image_path = "community1.png"  # Chemin vers l'image de l'onglet
        location = pyautogui.locateCenterOnScreen(image_path, confidence=0.8)
        pyautogui.moveTo(location, duration=0.5)
        pyautogui.click()
        print("Onglet 'Plugins communautaires - img2' trouvé et cliqué!")
        return
    except  pyautogui.ImageNotFoundException:
        print("Onglet 'Plugins communautaires' non trouvé.")    
    return
    
def open_settings():
    pyautogui.hotkey('ctrl', ',')
    time.sleep(2)
    
def restart_plugin():
    # Simule la touche Tab
    pyautogui.press('tab')
    time.sleep(0.2)  # Petite pause pour éviter un enchaînement trop rapide

    # Simule deux appuis sur la touche Space
    pyautogui.press('space')
    time.sleep(0.2)
    pyautogui.press('space')
    time.sleep(0.2)
    pyautogui.press('esc')
    time.sleep(1)

if __name__ == "__main__":
    vault_name = "obsidianPlug"  # Remplace par le nom de ton vault
    open_obsidian_with_uri(vault_name)
    open_settings()
    click_community_plugins()
    restart_plugin()
    print("Opération terminée !")

