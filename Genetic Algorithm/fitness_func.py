import numpy as np
import initializations

# Constants
MAX_COST = float('inf')  # A large value for cost initialization

# Fitness function
def fitness_func(ga_instance, solution, solution_idx):
    total_cost = 0
    total_amper = np.zeros(len(solution[0]))  # Initialize total amperage for each time slot

    for charge_info in solution:
        # Constraint 1: Ensure every bus exits the parking lot on time with enough SoC
        for bus_info in charge_info:
            if bus_info["socStart"] + bus_info["amperLevel"] > bus_info["socEnd"]:
                total_cost += MAX_COST  # Penalize solutions where a bus cannot exit on time with enough SoC

        # Constraint 2: Avoid exceeding the total charge (maxAmper) at any given moment
        total_amper += np.array([bus_info["amperLevel"] for bus_info in charge_info])
        if np.any(total_amper > ga_instance.max_amper):
            total_cost += MAX_COST  # Penalize solutions exceeding maxAmper

        # Objective 3: Prefer charging buses when electricity prices are lowest
        for bus_info in charge_info:
            time_range = (bus_info["startTime"], bus_info["endTime"])  # Charging time range for the bus
            for price_info in ga_instance.prices:  # Assuming prices is a list of (from, to, finalPriceInAgorot)
                if price_info["from"] <= time_range[0] < price_info["to"] and price_info["from"] <= time_range[1] < price_info["to"]:
                    total_cost += bus_info["amperLevel"] * (price_info["finalPriceInAgorot"] / 100)  # Add cost based on price

        # Objective 4: Minimize the use of fastest charging in high-level ampere
        for bus_info in charge_info:
            if bus_info["amperLevel"] == 1 and total_amper[charge_info.index(bus_info)] > ga_instance.max_amper * 0.7:
                total_cost += MAX_COST  # Penalize fastest charging at high-level ampere

        # Objective 5: Minimize the number of chargers used
        total_cost += len(set([bus_info["chargerCode"] for bus_info in charge_info])) * 10  # Penalize for each charger used

    return 1 / (1 + total_cost)

# Example usage:

# Example desired_output (can be empty or set to None for multi-objective problems)
desired_output = None

# Assuming prices is a list of (from, to, finalPriceInAgorot)
prices = initializations.getPrices()


