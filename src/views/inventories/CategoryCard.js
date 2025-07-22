import { Col, Card } from 'react-bootstrap';
import { useTranslation } from "react-i18next";

import { useFilterData } from "contexts/FilterContextManagment";

const CategoryCard = ({ category, getIngredientsStock }) => {
  const { t } = useTranslation();
  const { updateInventorySelectedCategories } = useFilterData();

  const handleClick = () => {
    updateInventorySelectedCategories({ category: category.label, color: category.color });
    getIngredientsStock(category);
  };

  return (
    <Col xs={6} md={4} style={{ display : 'flex', justifyContent: 'center'}}>
      <Card style={{ width: '280px', height: '190px', borderRadius: "25px", boxShadow: "2px 2px 6px 0px #00000040"}} 
        onClick={handleClick}>
        <Card.Body style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
          <div>
            <img src={category.imagePath} style={{ width: '67px', height: '67px', float: 'right' }} />
          </div>
          <Card.Title style={{ color: `${category.color}` }}>{t(`${category.label}`)}</Card.Title>
        </Card.Body>
      </Card>
    </Col>
  );
};

export default CategoryCard;