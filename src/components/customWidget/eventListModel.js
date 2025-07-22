import { useState, useEffect, useRef } from "react";
import { Spinner } from "react-bootstrap";
import omit from "lodash/omit";
import { useTranslation } from "react-i18next";
import { useUserData } from "contexts/AuthContextManagement";
import { Modal, Container, Form } from "react-bootstrap";
import "react-time-picker-input/dist/components/TimeInput.css";
import InfiniteScroll from "react-infinite-scroll-component";
import request from "services/request";
import { getEventIcon, formatEvent } from "./utils"

function CustomModal(props) {
  const { t } = useTranslation();
  const { selectedRestaurantId, isRestaurantLoaded, hasRetaurants } = useUserData();
  const pageRef = useRef({ limit: 10, page: 1, total: 0 });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isShow, setIsShow] = useState(props.show ?? false);

  const getEvents = async () => {
    try {
      const result = await request.get(
        "events",
        {
          ...omit(pageRef.current, ["total"]),
          restaurant_id: selectedRestaurantId,
          start_date : props?.date,
          end_date : props?.date
        }
      );
      pageRef.current.page += 1;
      pageRef.current.total = result.total_results;

      setEvents((prev) => [...prev, ...result.events]);
      setLoading(false);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    setIsShow(props.show ?? false);
    setEvents([]);
    setLoading(true);
    if (props.show) {
      pageRef.current.page = 1;
      getEvents(props?.date);
    }
  }, [props.show]);

  const onHide = () => {
    props.onHide();
  };

  return (
    <>
      <Modal
        show={isShow}
        onHide={onHide}
        size="lg"
        centered
        className="add-ingredient meal-list-modal"
        backdropClassName="add-ingredient-backdrop"
        dialogClassName="recurrence-modal"
      >
          {
            loading && (
              <div style={{
                height:"583px !important"
              }} className="w-100 d-flex justify-content-center align-items-center eventList">
                <Spinner animation="border" variant="primary" />
              </div>
            )
          }
          {
            !loading && (
              <>
                <Modal.Header className="add-restaurants-modal-header" closeButton>
                  <Modal.Title className="add-restaurants-modal-title">
                    Event List
                  </Modal.Title>
                </Modal.Header>
        
                <Modal.Body className="add-meal-list-body meal-list-body pt-0 pb-0">
                  <Container className="p-0">
                    <Form.Group>
                      <div className="position-relative ps-4 pe-4">
                        <InfiniteScroll
                          dataLength={events.length - 5}
                          next={getEvents}
                          hasMore={true}
                          height={475}
                          className="row"
                        >
                          <div style={{display: 'flex', flexDirection: "column", gap: "10px", alignItems: "center"}}>
                            <div>
                              {
                                events?.map((item, index) =>{
                                return (
                                  <>
                                    <div className="flex-shrink-0 me-2"  style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        marginBottom: "10px"
                                    }}>
                                      <div className="flex-shrink-0 me-2">
                                        <img
                                          src={item.image_path ? item.image_path : getEventIcon(formatEvent(item?.name))}                            
                                          alt=""
                                          style={{
                                              height:"80px",
                                              width:"80px"
                                          }}
                                        />
                                      </div>
                                      <div className="flex-grow-1 ms-2">
                                        <strong style={{fontSize: "15px"}} key={index}>{formatEvent(item?.name)}</strong>
                                      </div>
                                    </div>
                                  </>
                                )})
                              }
                            </div>
                          </div>
                        </InfiniteScroll>
                      </div>
                    </Form.Group>
                  </Container>
                </Modal.Body>
              </>
            )
          }
      </Modal>
    </>
  );
}

export default CustomModal;