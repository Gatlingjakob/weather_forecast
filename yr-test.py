import requests, json

print("Starting request...")

url = "https://api.met.no/weatherapi/locationforecast/2.0/compact"
params = {"lat": 55.6761, "lon": 12.5683}
headers = {"User-Agent": "example-script/1.0 youremail@example.com"}

try:
    response = requests.get(url, params=params, headers=headers)
    print("Status code:", response.status_code)

    if response.ok:
        print("Response OK, parsing JSON...")
        data = response.json()
        print("Top-level keys:", data.keys())

        timeseries = data["properties"]["timeseries"]
        first = timeseries[0]
        print("\nFirst forecast entry:")
        print(json.dumps(first, indent=2))
    else:
        print("Error:", response.text)

except Exception as e:
    print("Exception occurred:", e)
