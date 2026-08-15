import os
from PIL import Image

img_path = r"C:\Users\wwwbh\.gemini\antigravity\brain\fd5b9a9f-a7cb-4d15-b98a-81a37cccb09f\.user_uploaded\media_1786791232973.jpg"
res_dir = r"E:\Uzima Hisab\android-app\app\src\main\res"

sizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192
}

try:
    img = Image.open(img_path)
    # Target square centered on the flower:
    # Center X = 512, Center Y = 230
    # Half-size = 170 (Total size = 340)
    left = 512 - 170
    right = 512 + 170
    top = 230 - 170
    bottom = 230 + 170
    
    cropped = img.crop((left, top, right, bottom))
    
    # Save the cropped master
    scratch_dir = r"E:\Uzima Hisab\android-app\scratch"
    if not os.path.exists(scratch_dir):
        os.makedirs(scratch_dir)
    cropped.save(os.path.join(scratch_dir, "cropped_master.png"), "PNG")
    print("Master cropped image saved to scratch/cropped_master.png")
    
    # Resize and save for each android density folder
    for folder, size in sizes.items():
        target_folder = os.path.join(res_dir, folder)
        if not os.path.exists(target_folder):
            os.makedirs(target_folder)
            
        resized = cropped.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(os.path.join(target_folder, "ic_launcher.png"), "PNG")
        print(f"Saved {size}x{size} icon to {folder}/ic_launcher.png")
        
    print("All android launcher icons generated successfully!")
except Exception as e:
    print(f"Error: {e}")
