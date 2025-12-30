import initializePGRModule from "../../services/PGRInitialization";
import { useQuery } from "@tanstack/react-query";

const usePGRInitialization = ({tenantId}) => {
  return useQuery({
    queryKey: ["PGR_INITIALIZATION"],
    queryFn: () => initializePGRModule({tenantId})
  });
};

export default usePGRInitialization;