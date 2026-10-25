import os
from PIL import Image

img_path = r"C:\Users\wwwbh\.gemini\antigravity\brain\fd5b9a9f-a7cb-4d15-b98a-81a37cccb09f\.user_uploaded\media_1786791232973.jpg"
res_dir = r"E:\Uzima Hisab\android-app\app\src\main\res"
frontend_public = r"E:\Uzima Hisab\frontend\public"
scratch_dir = r"E:\Uzima Hisab\android-app\scratch"

sizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192
}

try:
    img = Image.open(img_path)
    
    # Crop full brand logo (Flower + Uzima Beads) without bottom Chinese banner
    # Bounding box is X: 235..793 (width 558), Y: 90..508 (height 418)
    logo = img.crop((235, 90, 793, 508))
    
    # 1024x1024 Master Canvas with 50% Zoom Out (width 512, centered on pure white)
    master = Image.new('RGB', (1024, 1024), (255, 255, 255))
    w_50 = 512
    h_50 = int(logo.height * (w_50 / logo.width))
    logo_resized = logo.resize((w_50, h_50), Image.Resampling.LANCZOS)
    x_50 = (1024 - w_50) // 2
    y_50 = (1024 - h_50) // 2
    master.paste(logo_resized, (x_50, y_50))
    
    os.makedirs(scratch_dir, exist_ok=True)
    master.save(os.path.join(scratch_dir, "cropped_master.png"), "PNG")
    print("Master 50% zoomed-out logo saved to scratch/cropped_master.png")
    
    # Generate Android density folders
    for folder, size in sizes.items():
        target_folder = os.path.join(res_dir, folder)
        os.makedirs(target_folder, exist_ok=True)
        
        resized = master.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(os.path.join(target_folder, "ic_launcher.png"), "PNG")
        resized.save(os.path.join(target_folder, "ic_launcher_round.png"), "PNG")
        print(f"Saved {size}x{size} icon to {folder}/ic_launcher.png & ic_launcher_round.png")
        
    # Also update frontend PWA icon
    os.makedirs(frontend_public, exist_ok=True)
    master.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(frontend_public, "icon-192.png"), "PNG")
    master.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(frontend_public, "icon-512.png"), "PNG")
    print("All android launcher icons and PWA icons generated successfully with 50% zoom out!")
except Exception as e:
    print(f"Error: {e}")
