
def getPopulation():
    return [
    [  
        {"chargerCode": 1, "trackCode": 101, "startTime": 8, "endTime": 10, "amperLevel": 1},
        {"chargerCode": 2, "trackCode": 102, "startTime": 9, "endTime": 11, "amperLevel": 2},
        {"chargerCode": 3, "trackCode": 103, "startTime": 9, "endTime": 11, "amperLevel": 3},
        {"chargerCode": 4, "trackCode": 104, "startTime": 9, "endTime": 11, "amperLevel": 2},
        {"chargerCode": 1, "trackCode": 101, "startTime": 10, "endTime": 12, "amperLevel": 2},
        {"chargerCode": 2, "trackCode": 105, "startTime": 9, "endTime": 11, "amperLevel": 2},
        {"chargerCode": 3, "trackCode": 103, "startTime": 11, "endTime": 12, "amperLevel": 1},
        {"chargerCode": 4, "trackCode": 106, "startTime": 7, "endTime": 11, "amperLevel": 2}
    ],
    [
        {"chargerCode": 1, "trackCode": 101, "startTime": 8, "endTime": 10, "amperLevel": 1},
        {"chargerCode": 2, "trackCode": 102, "startTime": 9, "endTime": 11, "amperLevel": 2},
        {"chargerCode": 3, "trackCode": 104, "startTime": 9, "endTime": 11, "amperLevel": 3},
        {"chargerCode": 4, "trackCode": 103, "startTime": 9, "endTime": 11, "amperLevel": 2},
        {"chargerCode": 1, "trackCode": 101, "startTime": 10, "endTime": 12, "amperLevel": 2},
        {"chargerCode": 2, "trackCode": 105, "startTime": 9, "endTime": 11, "amperLevel": 2},
        {"chargerCode": 3, "trackCode": 103, "startTime": 11, "endTime": 12, "amperLevel": 1},
        {"chargerCode": 4, "trackCode": 106, "startTime": 7, "endTime": 11, "amperLevel": 2}
    ]
]

def getFunctionInputs():
    return {
        "busses": [
            {"trackCode":101, "entryTime":7, "exitTime":13, "socStart":20, "socEnd":80},
            {"trackCode":102, "entryTime":8, "exitTime":11, "socStart":50, "socEnd":90},
            {"trackCode":103, "entryTime":9, "exitTime":14, "socStart":20, "socEnd":40},
            {"trackCode":104, "entryTime":9, "exitTime":15, "socStart":30, "socEnd":40},
            {"trackCode":105, "entryTime":7, "exitTime":11, "socStart":20, "socEnd":80},
            {"trackCode":106, "entryTime":7, "exitTime":12, "socStart":40, "socEnd":60}
        ],
        "maxAmper": 650,
        "prices": [
            {"from": 1706799600000, "to": 1706817540000, "finalPriceInAgorot": 114.78},
            {"from": 1706738400000, "to": 1706799540000, "finalPriceInAgorot": 41.84}, 
            {"from": 1706817600000, "to": 1706824740000, "finalPriceInAgorot": 41.84}
        ]
    }
