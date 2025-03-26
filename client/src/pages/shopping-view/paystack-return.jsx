import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { capturePayment } from "@/store/shop/order-slice";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";

function PaystackReturnPage() {
  const dispatch = useDispatch();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const reference = params.get("reference"); // Get Paystack transaction reference

  useEffect(() => {
    if (reference) {
      const orderId = JSON.parse(sessionStorage.getItem("currentOrderId"));

      dispatch(capturePayment({ reference, orderId }))
        .then((result) => {
          console.log('Capture Payment Result:', result); // Debug log

          // Check the actual structure of the result
          if (result.payload && result.payload.success) {
            sessionStorage.removeItem("currentOrderId");
            window.location.href = "/shop/payment-success";
          } else {
            console.error('Payment capture failed:', result);
            // Optionally, redirect to an error page
            window.location.href = "/shop/payment-error";
          }
        })
        .catch((error) => {
          console.error('Error in payment capture:', error);
          window.location.href = "/shop/payment-error";
        });
    }
  }, [reference, dispatch]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Processing Payment...Please wait!</CardTitle>
      </CardHeader>
    </Card>
  );
}


export default PaystackReturnPage