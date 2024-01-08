import readingFromDb


def getFunctionInputsDB():
    data = readingFromDb.read_data()
    return data

def getFunctionInputs():
    return {
        "busses": [
            {"trackCode":101, "entryTime":7, "exitTime":13, "socStart":20, "socEnd":80},
            {"trackCode":102, "entryTime":8, "exitTime":11, "socStart":50, "socEnd":90},
            {"trackCode":103, "entryTime":9, "exitTime":14, "socStart":20, "socEnd":40},
            {"trackCode":104, "entryTime":9, "exitTime":15, "socStart":30, "socEnd":40},
            {"trackCode":105, "entryTime":7, "exitTime":11, "socStart":20, "socEnd":80},
            {"trackCode":106, "entryTime":7, "exitTime":12, "socStart":40, "socEnd":60},
            {"trackCode":107, "entryTime":7, "exitTime":13, "socStart":20, "socEnd":80},
            {"trackCode":108, "entryTime":8, "exitTime":11, "socStart":50, "socEnd":90},
            {"trackCode":109, "entryTime":9, "exitTime":14, "socStart":20, "socEnd":40},
            {"trackCode":110, "entryTime":9, "exitTime":15, "socStart":30, "socEnd":40},
            {"trackCode":111, "entryTime":7, "exitTime":11, "socStart":20, "socEnd":80},
            {"trackCode":112, "entryTime":7, "exitTime":12, "socStart":40, "socEnd":60},
            {"trackCode":113, "entryTime":9, "exitTime":15, "socStart":30, "socEnd":40},
            {"trackCode":114, "entryTime":7, "exitTime":11, "socStart":20, "socEnd":80},
            {"trackCode":115, "entryTime":7, "exitTime":12, "socStart":40, "socEnd":60},
            {"trackCode":116, "entryTime":7, "exitTime":11, "socStart":20, "socEnd":80},
            {"trackCode":117, "entryTime":7, "exitTime":12, "socStart":40, "socEnd":60},
            {"trackCode":118, "entryTime":9, "exitTime":15, "socStart":30, "socEnd":40},
            {"trackCode":119, "entryTime":7, "exitTime":11, "socStart":20, "socEnd":80},
            {"trackCode":120, "entryTime":7, "exitTime":12, "socStart":40, "socEnd":60}
        ],
        "maxAmper": 650,
        "prices": [
            {"from": 1706799600000, "to": 1706817540000, "finalPriceInAgorot": 114.78},
            {"from": 1706738400000, "to": 1706799540000, "finalPriceInAgorot": 41.84}, 
            {"from": 1706817600000, "to": 1706824740000, "finalPriceInAgorot": 41.84}
        ],
        "chargers": [
            {"chargerCode": 1, "connectorId":1, "voltage":650},
            {"chargerCode": 1, "connectorId":2, "voltage":650},
            {"chargerCode": 2, "connectorId":1, "voltage":648},
            {"chargerCode": 2, "connectorId":2, "voltage":648},
            {"chargerCode": 3, "connectorId":1, "voltage":652},
            {"chargerCode": 3, "connectorId":2, "voltage":652},
            {"chargerCode": 4, "connectorId":1, "voltage":650},
            {"chargerCode": 4, "connectorId":2, "voltage":650}
        ]
    }

def getValues():
    return [
        [1, 2, 3, 4],
        [1, 2],
        [101, 102, 103, 104, 105, 106],
        None,
        None,
        [1, 2, 3, 4, 5],
        None
    ]

# [  3,   2, 101,   7,   8,   0,   0,   2,   1, 102,  10,  11,   1,
#          0,   4,   2, 103,  13,  14,   4,   0,   1,   1, 104,  11,  15,
#          1,   0,   4,   1, 105,   7,   8,   3,   0,   3,   1, 106,  11,
#         12,   5,   0,   4,   1, 107,  10,  12,   2,   0,   3,   2, 108,
#         10,  11,   0,   0,   3,   1, 109,   9,  13,   2,   0,   4,   2,
#        110,  11,  12,   0,   0,   2,   1, 111,   7,  10,   1,   0,   1,
#          1, 112,   8,  12,   5,   0,   1,   1, 113,   9,  10,   5,   0,
#          3,   1, 114,   8,   9,   0,   0,   4,   1, 115,   8,   9,   3,
#          0,   3,   2, 116,   7,   9,   0,   0,   3,   1, 117,  10,  11,
#          0,   0,   2,   2, 118,  12,  13,   4,   0,   2,   2, 119,   8,
#         11,   0,   0,   2,   2, 120,  10,  11,   2,   0]

# [  2,   2, 101,   8,  11,   1,   0,   1,   1, 102,   9,  11,   1,
#          0,   1,   1, 103,  12,  13,   1,   0,   4,   1, 104,  14,  15,
#          0,   0,   2,   1, 105,   7,   9,   2,   0,   3,   2, 106,   9,
#         10,   1,   0,   3,   1, 107,   9,  12,   2,   0,   4,   1, 108,
#         11,  11,   3,   0,   3,   2, 109,  10,  11,   5,   0,   4,   2,
#        110,  11,  12,   1,   0,   2,   2, 111,   8,   9,   4,   0,   1,
#          2, 112,  11,  12,   2,   0,   3,   2, 113,  13,  14,   0,   0,
#          1,   1, 114,   7,  11,   2,   0,   4,   1, 115,   7,  10,   5,
#          0,   1,   2, 116,   8,  10,   1,   0,   2,   2, 117,  12,  12,
#          5,   0,   2,   1, 118,  13,  15,   3,   0,   4,   2, 119,   7,
#          9,   4,   0,   2,   1, 120,  11,  12,   0,   0]
# # 0.007