import fs from 'fs';
import path from 'path';
import csvParse from 'csv-parse';

import Transaction from '../models/Transaction';
import uploadConfig from '../config/uploadConfig';
import CreateTransactionService from './CreateTransactionService';

interface Request {
  file_name: string;
}

interface TransactionToCreate {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category_title: string;
}

class ImportTransactionsService {
  async execute({ file_name }: Request): Promise<Transaction[]> {
    const file_path = path.join(uploadConfig.directory, file_name);

    const readCSVStream = fs.createReadStream(file_path);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const transactions: Transaction[] = [];
    const transactions_to_create: TransactionToCreate[] = [];

    const createTransaction = new CreateTransactionService();

    parseCSV.on('data', line => {
      const [title, type, value, category] = line;

      transactions_to_create.push({
        title,
        type,
        value: Number(value),
        category_title: category,
      });
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    await transactions_to_create.reduce(
      async (lastPromise, transaction_to_create) => {
        await lastPromise;

        const transaction = await createTransaction.execute(
          transaction_to_create,
        );

        transactions.push(transaction);
      },
      (undefined as unknown) as Promise<void>,
    );

    await fs.promises.unlink(file_path);

    return transactions;
  }
}

export default ImportTransactionsService;
