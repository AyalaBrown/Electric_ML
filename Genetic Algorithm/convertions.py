import initialPopulation
def encode_schedule(population):
    binary_population = []
    for schedule in population:
        binary_string = ""
        for charging_info in schedule:
            binary_string += format(charging_info["chargerCode"], '032b')  # 32 bits for charger code
            binary_string += format(charging_info["trackCode"], '032b')    # 32 bits for track code
            binary_string += format(charging_info["startTime"], '064b')   # 64 bits for start time
            binary_string += format(charging_info["endTime"], '064b')   # 64 bits for end time
            binary_string += format(charging_info["amperLevel"], '03b')  # 3 bits for amper level
        binary_population.append(binary_string)
    print(binary_population)
    return binary_population

def convert_population_to_numeric(population):
    numeric_population = []

    for schedule in population:
        numeric_schedule = []
        for entry in schedule:
            numeric_schedule.extend([entry["chargerCode"], entry["connectorId"], entry["trackCode"], entry["startTime"], entry["endTime"], entry["amperLevel"], entry["price"]])
        numeric_population.append(numeric_schedule)
    print(numeric_population)
    return numeric_population


def decode_schedule(binary_population):
    population = []
    for binary_list in binary_population:
        binary_string = "".join([str(bit) for bit in binary_list])
        schedule = []
        if len(binary_string) % 195 != 0:
            raise ValueError("Invalid binary string length")
        for i in range(0, len(binary_string), 195):
            charging_info = {
                "chargerCode": int(binary_string[i:i+32], 2),
                "trackCode": int(binary_string[i+32:i+64], 2),
                "startTime": int(binary_string[i+64:i+128], 2),
                "endTime": int(binary_string[i+128:i+192], 2),
                "amperLevel": int(binary_string[i+192:i+195], 2)
            }
            schedule.append(charging_info)
        population.append(schedule)
    return population

def initial_population():   
    bus_schedule = initialPopulation.init_pop(5)
    numeric_representation = convert_population_to_numeric(bus_schedule)
    return numeric_representation



        # binary_list = [int(binary_string[i:i+8], 2) for i in range(0, len(binary_string), 8)]
        # binary_list = [int(bit) for bit in binary_string]