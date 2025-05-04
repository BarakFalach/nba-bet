import hashlib
# This function generates a unique ID for the playoff series based on the team names.
def generate_id(input1, input2):
    hash_input = f"{input1}{input2}".encode()
    hash_object = hashlib.sha256(hash_input)
    return "30" + str(int(hash_object.hexdigest(), 16))[:8]


if __name__ == "__main__":
    # Example usage
    team1 = "Cavaliers"
    team2 = "Pacers"
    generated_id = generate_id(team1, team2)
    print(f"Generated ID for {team1} vs {team2}: {generated_id}")