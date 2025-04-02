import os
import pyautogui
import time
import subprocess
import shutil
import os

###############################################
#
#To work, need
#*  for setting: need 2 image, one of community2 when selected and one of  community when not selected.
#
#
###############################################

import shutil
import os

def cp_tests_files():
    # Chemin du dossier TESTS_23_a (assurez-vous qu'il existe)
    source_folder = "TESTS_23_a"
    
    # Chemin de destination (racine du plugin)
    destination_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../../"+source_folder)
    
    # Vérifie si le dossier source existe
    if not os.path.exists(source_folder):
        print(f"Le dossier source '{source_folder}' n'existe pas.")
        return
    
    # Si le dossier de destination existe déjà, supprime-le
    if os.path.exists(destination_folder):
        try:
            shutil.rmtree(destination_folder)
            print(f"Dossier existant '{destination_folder}' supprimé.")
        except Exception as e:
            print(f"Erreur lors de la suppression du dossier existant : {e}")
            return
    
    # Copie le dossier source vers la destination
    try:
        shutil.copytree(source_folder, destination_folder)
        print(f"Dossier '{source_folder}' copié avec succès à '{destination_folder}'")
    except Exception as e:
        print(f"Erreur lors de la copie du dossier : {e}")




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
    
def open_prop_tab():
    pyautogui.hotkey('ctrl', 'shift', 'f')
    time.sleep(0.5)  # Pause pour laisser le temps à l'UI de réagir
    pyautogui.hotkey('ctrl', 'tab')
    time.sleep(0.2)
    pyautogui.hotkey('ctrl', 'tab')
    
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
    vault_name = "properties-global-view"  # Remplace par le nom de ton vault
    cp_tests_files()
    open_obsidian_with_uri(vault_name)
    open_settings()
    click_community_plugins()
    restart_plugin()
    open_prop_tab()
    print("Opération terminée !")

