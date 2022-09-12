import {
    Keypair,
    Connection,
    PublicKey,
    LAMPORTS_PER_SOL,
    SystemProgram,
    TransactionInstruction,
    Transaction,
    sendAndConfirmTransaction,
  } from '@solana/web3.js';
import * as borsh from 'borsh';
import {getPayer, getRpcUrl} from './utils';

const MAX_SIZE = 1000;

const STRING_CONTRACT_ID = "5GZ4FmXrzkfUXPQc2dbidDaxckoGrQ8RViMzeHfNdJ2g";

let connection;
let payer: Keypair;
let stringProgramId: PublicKey;

// Flexible class that takes properties and imbues them
// to the object instance
// with this we do not have to pre-define the variables of the class
class Assignable {
    constructor(properties) {
        Object.keys(properties).map((key) => {
            return (this[key] = properties[key]);
        });
    }
}

// Payload instances will be used to send serialized data to the contract
// as instruction data
class Payload extends Assignable { }

// The below struct will be mapped to a struct in the contract 
// The contract struct will have some strings in it
const payloadSchema = new Map([
    [
        Payload,
        {
            kind: "struct",
            fields: [
                ["id", "u8"],
                ["firstname", "string"],
                ["lastname", "string"]
            ]
        }
    ]
]);


/**
 * Establish a connection to the cluster
 */
 export async function establishConnection(): Promise<void> {
    const rpcUrl = await getRpcUrl();
    connection = new Connection(rpcUrl, 'confirmed');
    const version = await connection.getVersion();
    console.log('Connection to cluster established:', rpcUrl, version);
}
  
/**
 * Establish an account to pay for everything
 */
export async function establishPayer(): Promise<void> {
    let fees = 0;
    if (!payer) {
      const {feeCalculator} = await connection.getRecentBlockhash();
  
      // Calculate the cost to fund the greeter account
      fees += await connection.getMinimumBalanceForRentExemption(MAX_SIZE);
  
      // Calculate the cost of sending transactions
      fees += feeCalculator.lamportsPerSignature * 100; // wag
  
      payer = await getPayer();
    }
  
    let lamports = await connection.getBalance(payer.publicKey);
    if (lamports < fees) {
      // If current balance is not enough to pay for fees, request an airdrop
      const sig = await connection.requestAirdrop(
        payer.publicKey,
        fees - lamports,
      );
      await connection.confirmTransaction(sig);
      lamports = await connection.getBalance(payer.publicKey);
    }
  
    console.log(
      'Using account',
      payer.publicKey.toBase58(),
      'containing',
      lamports / LAMPORTS_PER_SOL,
      'SOL to pay for fees',
    );
}

/**
 * Check if the string-contract program has been deployed
 */
 export async function checkStringProgram(): Promise<void> {
    stringProgramId = new PublicKey(STRING_CONTRACT_ID);

    const stringProgramInfo = await connection.getAccountInfo(stringProgramId);
    if (stringProgramInfo === null) {
        throw new Error(`String program not found`);
    } else if (!stringProgramInfo.executable) {
        throw new Error(`String program is not executable`);
    }
    console.log(`String program ID being used is ${stringProgramId.toBase58()}`);

}

export async function sendStringToProgram(): Promise<void> {

    const stringPayload = new Payload({
        id: 1,
        firstname: "John",
        lastname: "Smith"
    });

    const stringPayloadBuffer = Buffer.from(borsh.serialize(payloadSchema, stringPayload));
    if (stringPayloadBuffer.byteLength === 0) {
        throw new Error('Failed to serialize payload to buffer');
    }

    const instruction = new TransactionInstruction({
        keys: [],
        programId: stringProgramId,
        data: stringPayloadBuffer
    });

    await sendAndConfirmTransaction(
        connection, 
        new Transaction().add(instruction),
        [payer]
    );

    console.log("String data buffer was sent to the smart contract");
}




