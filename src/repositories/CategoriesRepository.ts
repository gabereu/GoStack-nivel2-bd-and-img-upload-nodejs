import { EntityRepository, Repository } from 'typeorm';

import Category from '../models/Category';

interface Request {
  title: string;
}

@EntityRepository(Category)
class CategoriesRepository extends Repository<Category> {
  public async findOneOrCreate({ title }: Request): Promise<Category> {
    const category_already_created = await this.findOne({ where: { title } });

    if (category_already_created) return category_already_created;

    const category = this.create({ title });

    await this.save(category);

    return category;
  }
}

export default CategoriesRepository;
