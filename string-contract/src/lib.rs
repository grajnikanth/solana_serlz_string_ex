// String contract to deserialize the data sent by client code

use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    system_instruction,
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
    sysvar::{rent::Rent, Sysvar},
};



// used to send instruction to address-contract
#[derive(Clone, Debug, BorshSerialize, BorshDeserialize, PartialEq)]
pub struct StringData {
    id: u8,
    firstname: String,
    lastname: String
}

// Declare and export the program's entrypoint
entrypoint!(process_instruction);

// Program entrypoint's implementation
pub fn process_instruction(
    program_id: &Pubkey, // Public key of the account the hello world program was loaded into
    accounts: &[AccountInfo], 
    instruction_data: &[u8], 
) -> ProgramResult {
    msg!("Hello World String program entrypoint");

    let string_data = StringData::try_from_slice(instruction_data)
        .map_err(|_| ProgramError::InvalidInstructionData)?;

    msg!("Instruction data containing string was successfully deserialized in the contract");
    msg!("String data sent to the contract is {:?}", string_data);

    Ok(())
}

