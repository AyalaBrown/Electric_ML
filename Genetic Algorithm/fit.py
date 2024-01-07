import numpy as np
import initializations
import convertions

def fitness(solution):
    print("fitness: ", solution)
    parameters = initializations.getFunctionInputs()
    busses = parameters["busses"]

    # weights:
    # constraint 1 - A bus is scheduled to charge while it is in the parking lot
    w1 = 0.5
    # constraint 2 - A bus is not scheduled to charge at the same time to two different chargers
    w2 = 0.5

    total_cost = 0

    # calaulate the total cost:
    # constraint 1 - A bus is scheduled to charge while it is in the parking lot
    cost1 = 0
    good = 0
    not_good = 0
    for i in range(0, len(solution), 5):
        _, bus_code, start_time, end_time, _ = solution[i:i+5] 
        # if the charge end before it start the schedule is not good
        # print("parameters: ",bus_code, start_time, end_time)
        if start_time > end_time:
            # print("add 1 to not good")
            not_good+=1
        else:
            for bus in busses:
                # print("bus_code: ", bus_code)
                # print("bus: ", bus["trackCode"])
                # if the bus is scheduled to charge while it is in the parking lot the schedule is good otherwise not good
                if bus["trackCode"] == bus_code:
                    start = bus["entryTime"]
                    end = bus["exitTime"]
                    if start <= start_time and end_time <= end:
                        # print("add 1 to good")
                        good+=1
                    else:
                        # print("add 1 to not good")
                        not_good+=1
    # print(f"good: {good}, not good: {not_good}")
    cost1 = w1*not_good/(good+not_good)

    # constraint 2 - A bus is not scheduled at the same time to two different chargers
    cost2 = 0
    good = 0
    not_good = 0
    for i in range(0, len(solution), 5):
        _, bus_code, start_time, end_time, _ = solution[i:i+5] 
        for j in range(i+5, len(solution), 5):
            _, bus_code2, start_time2, end_time2, _ = solution[j:j+5] 
            if bus_code == bus_code2 and start_time <= end_time2 and end_time >= start_time2:
                not_good+=1
            else:
                good+=1
    cost2 = w2*not_good/(good+not_good)


    total_cost = cost1 + cost2
    print(f"Total cost of the solution : {total_cost}")

    return total_cost