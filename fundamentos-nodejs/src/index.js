const express = require('express');
const { v4: hashv4 } = require('uuid');

const app = express();
app.use(express.json());

const db = [];


function verifyIfExistsAccountCpf(req, res, next) {

    const { cpf } = req.headers;

    const costumer = db.find(costumer => costumer.cpf === cpf);

    if(!costumer){
        return res.status(400).json({"error": "Customer not exists!"});
    };

    req.costumer = costumer;

    return next();

}

function getBalance(statement) {
    
    const balance = statement.reduce( (acc, operantion) => {

        if(operantion.type === 'credit') {
            return acc + operantion.amount;
        } else { 
            return acc - operantion.amount;
        }
    }, 0);

    return balance;
}

//Criar conta
app.post("/account", (req,res) => {

    const { name, cpf } = req.body;

    const id = hashv4();

    const customerAlreadyExist = db.some(customer => customer.cpf === cpf);

    if(customerAlreadyExist) {
        return res.status(400).json({"error": "Customer already exists!"})
    };

    db.push({
        name,
        cpf,
        statement: []
    });

    return res.status(201).json(db);
})

//Consultando extratos
app.get("/statement", verifyIfExistsAccountCpf, (req, res) => {

    const { costumer } = req;

    return res.json(costumer.statement)
});

//Depositando dinheiro
app.post("/deposit", verifyIfExistsAccountCpf, (req, res) => {

    const { costumer } = req;

    const { description, amount } = req.body;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    };

    costumer.statement.push(statementOperation);

    return res.status(201).send();

});

//Sacando dinheiro
app.post("/withdraw", verifyIfExistsAccountCpf, (req, res) => {

    const { costumer } = req;

    const { amount } = req.body;

    const balance = getBalance(costumer.statement);

    if (amount > balance) {
        return res.status(400).json({"error": "Insufficient funds!"});
    } 

    costumer.statement.push({
        amount,
        created_at: new Date(),
        type: "debit"
    })

    return res.status(201).send();

});

app.get("/statement/date", verifyIfExistsAccountCpf, (req, res) => {

    const { costumer } = req;
    const { date } = req.query;

    const dateFormat = new Date(date + " 00:00")
    console.log(dateFormat)

    const statement = costumer.statement.filter(statement => statement.created_at.toDateString() === dateFormat.toDateString());

    return res.json(statement);

});

app.put("/account", verifyIfExistsAccountCpf, (req, res) => {

    const { costumer } = req;
    const { name } = req.body

    costumer.name = name;

    return res.status(201).send();

});

app.get("/account", verifyIfExistsAccountCpf,  (req, res) => {

    const { costumer } = req;

    return res.json(costumer);
});

app.delete("/account", verifyIfExistsAccountCpf, (req, res) => {

    const { costumer } = req;

    db.splice(costumer, 1)

    return res.status(200).json(db);

});

app.get("/balance", verifyIfExistsAccountCpf, (req, res) => {

    const { costumer } = req;

    return res.status(200).json(getBalance(costumer.statement));

});

//localhost:3333 
app.listen(3333);
