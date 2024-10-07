import json
import pandas as pd

chemin = "./data_brut.json"
chemin_export = "./data/data_processed.json"

income_distrib = []

with open(chemin) as f:

    pre = f.read()
    data = json.loads(pre)
    data = data[0:100]
    # print(data)
    for i in range(len(data)):
        income_distrib.append({"percentile" : i+1, "threshold":data[i]['World Threshold (â‚¬)']})
# print(income_distrib)


with open(chemin_export, 'w') as j:

    json_object = json.dumps(income_distrib, indent = 4) 
    j.write(json_object)

#save percentiles in a json file - data from OWID 
PIP_VERSION = "2024-03-27"

# PIP percentiles URL
PIP_URL = f"http://catalog.ourworldindata.org/garden/wb/{PIP_VERSION}/world_bank_pip/percentiles_income_consumption_2017.feather"

df_percentiles = pd.read_feather(PIP_URL)

df_to_json = "./data/data_owid.json"

df_percentiles = df_percentiles[(df_percentiles["country"] == "World")].reset_index(drop=True)
    # Compare thr values with the one in the previous row
df_percentiles["thr_previous"] = (df_percentiles["thr"].groupby(df_percentiles["year"]).shift(1))
df_percentiles["thr_check"] = (df_percentiles["thr"] >= df_percentiles["thr_previous"])

# Assert that all values are True
df_percentiles_check = df_percentiles[(df_percentiles["thr_check"]) & (df_percentiles["percentile"] != 1)]
assert df_percentiles_check["thr_check"].all(), "The global distribution is not monotonically increasing"

# Keep only the relevant columns
df_percentiles = df_percentiles[["country", "year", "percentile", "thr"]]

# Filter for the latest year
df_percentiles = df_percentiles[df_percentiles["year"] == df_percentiles["year"].max()].reset_index(drop=True)

df_percentiles.to_json(df_to_json, orient='records', lines=True)