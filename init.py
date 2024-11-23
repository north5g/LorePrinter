import os
import requests

API_URL = "https://api.lorcana-api.com/bulk/cards"
DOWNLOAD_FOLDER = "images"

def download_images_from_api(api_url, download_folder):
    # Ensure the download folder exists
    os.makedirs(download_folder, exist_ok=True)

    try:
        # Fetch the data from the API
        print("Fetching data from the API...")
        response = requests.get(api_url)
        response.raise_for_status()
        cards = response.json()

        print(f"Found {len(cards)} cards. Downloading images...")
        counter = 0
        for card in cards:
            # Extract the image URL
            image_url = card.get("Image")
            if not image_url:
                print(f"No image URL found for card: {card.get('name', 'Unknown')}")
                continue

            # Extract the last segment of the URL to use as a filename
            file_name = image_url.split("/")[-1]
            file_path = os.path.join(download_folder, file_name)

            # Download and save the image
            try:
                image_response = requests.get(image_url, stream=True)
                image_response.raise_for_status()

                with open(file_path, "wb") as f:
                    for chunk in image_response.iter_content(chunk_size=8192):
                        f.write(chunk)
                counter += 1
                if counter > 500:
                    break

                print(f"Downloaded: {file_name}")
            except Exception as e:
                print(f"Failed to download {image_url}: {e}")
                

        print("Image download complete.")
    except Exception as e:
        print(f"Error fetching data from API: {e}")

# Run the function
download_images_from_api(API_URL, DOWNLOAD_FOLDER)