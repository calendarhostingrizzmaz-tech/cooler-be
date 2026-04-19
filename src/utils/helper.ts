import * as bcrypt from 'bcrypt';

export class Helper {
  /**
   *this method encode the password using bcrypt library
   * @param password user password provided as string
   * @returns
   */
  public static async hashPassword(password: string): Promise<string> {
    const saltOrRounds = 10;
    const hash = await bcrypt.hash(password, saltOrRounds);
    return hash;
  }

  /**
   *this method match the password using bcrypt library
   * @param password user password provided as string
   * @param userPassword encrypted password stored in database
   * @returns
   */
  public static async comparePassword(password: string, userPassword: string) {
    if (!password || !userPassword) {
      console.error(
        `Invalid arguments for comparePassword: password is "${password}", userPassword is "${userPassword}"`,
      );
      return false;
    }
    const compare = bcrypt.compareSync(password, userPassword);
    return compare;
  }

  /**
   * this method will paginate the data
   * @param data array of data with array indexes
   * @param page number of page to paginate
   * @param limit number of items to show per page
   * @returns array of paginated data along with metadata
   */
  public static paginateResponse({
    data,
    page,
    limit,
  }: {
    data: [Array<unknown>, number];
    page: number;
    limit: number;
  }) {
    const [result, total] = data;
    const totalPages = Math.ceil(total / limit);
    // const lastPage = Math.ceil(total / limit);
    const nextPage = page + 1 > totalPages ? null : page + 1;
    const prevPage = page - 1 < 1 ? null : page - 1;
    return {
      data: [...result],
      metaInfo: {
        totalRecords: total,
        itemsPerPage: result.length,
        currentPage: page,
        nextPage: nextPage,
        prevPage: prevPage,
        totalPages: totalPages,
      },
    };
  }

  public static convertIntoUTCTime(dataString: number) {
    const timestamp = dataString * 1000; // Convert to milliseconds
    const date = new Date(timestamp);
    return date;
  }

  /**
   * Generates a random 6-digit OTP (One-Time Password).
   *
   * @returns The generated OTP as a string.
   */
  public static generateOTP(): string {
    // Generate a random 6-digit number
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    return otp;
  }
}
