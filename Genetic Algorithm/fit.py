import numpy as np
import initializations
import convertions

def fitness(solution):
    parameters = initializations.getFunctionInputsDB()
    busses = parameters["busses"]
    maxAmper = parameters["maxAmper"]

    # constraints
    # constraint 1 - A bus is scheduled to charge while it is in the parking lot
    # constraint 2 - There are not conflicts between busses and chargers
    # constraint 3 - The the total consumption of the ampere in the parking lot not exceeds the max ampere 
    # constraint 4 - A bus charging enough for it's tasks

    # weights:
    # constraint 1
    w1 = 0.30
    # constraint 2
    w2 = 0.30
    # constraint 3 
    w3 = 0.20
    # constraint 4
    w4 = 0.20

    total_cost = 0

    # parameters:
    # constraint 1
    cost1 = 0
    good1 = 0
    not_good1 = 0
    # constraint 2
    cost2 = 0
    good2 = 0
    not_good2 = 0
    # constraint 3 
    cost3 = 0
    total_ampere = 0

    for i in range(0, len(solution), 7):

        chargerCode, connectorId, bus_code, start_time, end_time, ampere, price = solution[i:i+7] 

        # constraint 1
        if start_time > end_time:
            not_good1+=1
        else:
            for bus in busses:
                if bus["trackCode"] == bus_code:
                    start = bus["entryTime"]
                    end = bus["exitTime"]
                    if start <= start_time and end_time <= end:
                        good1+=1
                    else:
                        not_good1+=1

        # constraint 2 
        for j in range(i+7, len(solution), 7):
            chargerCode2, connectorId2, bus_code2, start_time2, end_time2, _, _ = solution[j:j+7] 
            if bus_code == bus_code2 and start_time <= end_time2 and end_time >= start_time2:
                not_good2+=1
            else:
                good2+=1
            if chargerCode == chargerCode2 and connectorId == connectorId2 and start_time <= end_time2 and end_time >= start_time2:
                not_good2+=1
            else:
                good2+=1

        # constraint 3
        total_ampere += ampere

    if total_ampere > maxAmper:
        cost3 = w3
    else:
        cost3 = 0
    cost1 = w1*not_good1/(good1+not_good1)
    cost2 = w2*not_good2/(good2+not_good2)
    total_cost = cost1 + cost2 + cost3

    return total_cost
