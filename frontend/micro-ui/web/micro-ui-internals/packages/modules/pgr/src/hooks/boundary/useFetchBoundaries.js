import fetchBoundaries from "../../services/boundary/BoundaryService";
import { useQuery } from "@tanstack/react-query";

const useFetchBoundaries = (tenantId, config = {}) => {
    
  return useQuery({
    queryKey: ["FETCH_BOUNDARIES"],
    queryFn: () => fetchBoundaries({tenantId}),
    ...config
  });
};

export default useFetchBoundaries;