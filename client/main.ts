import { 
    establishConnection, 
    establishPayer, 
    checkStringProgram,
    sendStringToProgram
} from "./index";

const main = async() => {
    await establishConnection();
    await establishPayer();
    await checkStringProgram();
    await sendStringToProgram();
}

main()