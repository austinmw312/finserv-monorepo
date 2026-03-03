import { app } from "./app";
import { Logger } from "@finserv/logger";

const logger = new Logger("api-gateway");
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`API Gateway listening on port ${PORT}`);
});
