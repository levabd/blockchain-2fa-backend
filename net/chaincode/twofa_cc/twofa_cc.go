/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/*
 * The sample smart contract for documentation topic:
 * Writing Your First Blockchain Application
 */

package main

/* Imports
 * 4 utility libraries for formatting, handling bytes, reading and writing JSON, and string manipulation
 * 2 specific Hyperledger Fabric specific libraries for Smart Contracts
 */
import (
	"encoding/json"
	"fmt"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	sc "github.com/hyperledger/fabric/protos/peer"
)

// Define the Smart Contract structure
type SmartContract struct {
}

type User struct {
	PhoneNumber string `json:"PhoneNumber"`
	PushToken   string `json:"PushToken"`
}

/*
 * The Init method is called when the Smart Contract "fabcar" is instantiated by the blockchain network
 * Best practice is to have any Ledger initialization in separate function -- see initLedger()
 */
func (s *SmartContract) Init(APIstub shim.ChaincodeStubInterface) sc.Response {
	return shim.Success(nil)
}

/*
 * The Invoke method is called as a result of an application request to run the Smart Contract "fabcar"
 * The calling application program has also specified the particular smart contract function to be called, with arguments
 */
func (s *SmartContract) Invoke(APIstub shim.ChaincodeStubInterface) sc.Response {

	// Retrieve the requested Smart Contract function and arguments
	function, args := APIstub.GetFunctionAndParameters()
	// Route to the appropriate handler function to interact with the ledger appropriately

	if function == "initLedger" {
		return s.initLedger(APIstub)
	} else if function == "createUser" {
		return s.createUser(APIstub, args)
	} else if function == "queryUser" {
		return s.queryUser(APIstub, args)
	} else if function == "setUserPush" {
		return s.setUserPush(APIstub, args)
	}

	return shim.Error("Invalid Smart Contract function name.")
}

func (s *SmartContract) initLedger(APIstub shim.ChaincodeStubInterface) sc.Response {
	users := []User{
		User{PhoneNumber: "77053234005", PushToken: ""},
	}

	i := 0
	for i < len(users) {
		fmt.Println("i is ", i)
		userAsBytes, _ := json.Marshal(users[i])
		APIstub.PutState(users[i].PhoneNumber, userAsBytes)
		fmt.Println("Added", users[i])
		i = i + 1
	}

	return shim.Success(nil)
}

func (s *SmartContract) createUser(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	// args[0] - PhoneNumber (example - 79953234005)
	// args[1] - PushToken (example - fm5675ybdrgdfyjdr5745)

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2.")
	}

	var user = User{PhoneNumber: args[1], PushToken: args[2]}

	userAsBytes, _ := json.Marshal(user)
	APIstub.PutState(args[0], userAsBytes)

	return shim.Success(nil)
}

func (s *SmartContract) queryUser(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	// args[0] - PhoneNumber (example - 79953234005)

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1.")
	}

	userAsBytes, err := APIstub.GetState(args[0])
	if err != nil {
		return shim.Error(err.Error())
	}

	if userAsBytes == nil {
		return shim.Error("User not found.")
	}


	return shim.Success(userAsBytes)
}

func (s *SmartContract) setUserPush(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	// args[0] - PhoneNumber (example - 79953234005)
	// args[1] - PushToken (example - fm5675ybdrgdfyjdr5745)

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2.")
	}

	if args[1] == "" {
		return shim.Error("PushToken is empty")
	}

	userAsBytes, err := APIstub.GetState(args[0])
	if err != nil {
		return shim.Error(err.Error())
	}

	if userAsBytes == nil {
		return shim.Error("User not found.")
	}

	var user = User{}
	err = json.Unmarshal(userAsBytes, &user)
	if err != nil {
		return shim.Error(err.Error())
	}

	// Update
	user.PushToken = args[1]

	// Store
	userAsBytes, _ = json.Marshal(user)
	APIstub.PutState(args[0], userAsBytes)

	return shim.Success(nil)
}

// The main function is only relevant in unit test mode. Only included here for completeness.
func main() {

	// Create a new Smart Contract
	err := shim.Start(new(SmartContract))
	if err != nil {
		fmt.Printf("Error creating new Smart Contract: %s", err)
	}
}
