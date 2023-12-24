class ApiFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }
  search() {
    const keyword = this.queryStr.keyword
      ? {
          name: {
            $regex: this.queryStr.keyword,
            $options: "i", // MongoDB syntax for a case-insensitive regular expression
          },
        }
      : {};
    // console.log(keyword)

    this.query = this.query.find({ ...keyword });
    return this;
  }

  filter() {
    const queryCopy = { ...this.queryStr };

    // Exclude fields that should not be used for filtering
    const removeFields = ["keyword", "page", "pageSize"];
    removeFields.forEach((key) => delete queryCopy[key]);
    // console.log(queryCopy)

    // Advanced filter for numeric fields (e.g., price range)
    // queryCopy = { price: { gte: '12000', lt: '13000' } }
    // queryStr  = {"price":{"$gte":"12000","$lt":"13000"}}

    let queryStr = JSON.stringify(queryCopy);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (key) => `$${key}`);

    this.query = this.query.find(JSON.parse(queryStr));
    // console.log(queryStr)

    return this;
  }

  pagination(resultPerPage){
    const currentPage = parseInt(this.queryStr.page) || 1;
    const skip = (currentPage - 1) * resultPerPage;

    this.query = this.query.skip(skip).limit(resultPerPage);
    return this;

  }
}

module.exports = ApiFeatures;
