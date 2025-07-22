import React, { Fragment, useState } from "react";
import CreateLinkIcon from "assets/images/icon/create-link.svg"
import TermsLogo from "assets/images/terms_logo.png";


import {
  Button,
  Form,
  Modal,
  Row,
  Table,
} from "react-bootstrap";
import { useTranslation } from "react-i18next";

function TermsModal({
  onHide,
  show,
}) {
  const { t } = useTranslation();
  const restaurants = []


  const customCheckbox = ({ name, id, label, checked, onChange, type = null }) => (
    <Form.Group className="mb-3">
      <label className="checkbox">
        <input
          type="checkbox"
          onChange={() => onChange(id)}
          name={name}
          checked={checked}
        />
        <span className="me-2" />
        {label}
      </label>
    </Form.Group>
  );

  const createLinkHandler = () => {
    onHide()
  }

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="xl"
      centered
      className="add-ingredient terms-modal "
      backdropClassName="add-ingredient-backdrop"
    >
      <Modal.Header style={{padding: "10px 40px"}} className="add-restaurants-modal-header header_style" closeButton>
          <Modal.Title style={{ marginBottom: "20px"}} className="add-restaurants-modal-title">
           <img src={TermsLogo} alt="terms logo" />
          </Modal.Title>
            <Row>
              <p style={{fontWeight: "bold", fontSize: "21px"}}>{t("Terms and conditions")}</p>
              <p style={{fontSize: "16px"}}>{t("Please read our terms and conditions below carefully.")}</p>
            </Row>
            <Row style={{display: "flex", justifyContent: "center"}}></Row>
            <Row style={{ width: "100%", height: "1px", backgroundColor: "gray", opacity: "30%"}}></Row>
      </Modal.Header>

      <Modal.Body className="terms-body" style={{padding: "10px 40px"}}>
           
          <ul style={{ overflowY: "scroll"}}>
            <li className="mt-5">
              <h5 style={{ fontWeight: "bold", fontSize: "16px", color: "black"}}>1.	IDENTIFICATION DE LA SOCIÉTÉ</h5>
              <p style={{ marginTop: "15px", fontSize: "16px"}}><b>La société FULLSOON (la « FULLSOON »)</b> est une société par actions simplifiée inscrite au RCS de Nanterre sous le n° 910029339, dont le siège social est situé 36 rue Raspail, LEVALLOIS (92).</p>
            </li>
            <li className="mt-5">
              <h5 style={{ fontWeight: "bold", fontSize: "16px", color: "black"}}>2.	SERVICES PROPOSÉS</h5>
              <p style={{ marginTop: "15px", fontSize: "16px"}}>Fullsoon propose au client (le « <b>Client</b> ») une solution innovante de planification et d’analyse de données à destination des entreprises du secteur de la restauration et de la vente au détail de produits alimentaires, accessible en ligne en mode software-as-a-service (la « <b>Plateforme</b> ») dans les conditions ci-après définies (les « <b>Conditions générales</b> »).</p>
            </li>
            <li className="mt-5">
              <h5 style={{ fontWeight: "bold", fontSize: "16px", color: "black"}}>3.	INFORMATIONS SUR LES CONDITIONS GENERALES</h5>
              <Table bordered>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: "bold"}}>Fonction des Conditions Générales</td>
                    <td>Les Conditions générales constitue l’unique document régissant la relation contractuelle de Fullsoon avec le Client et définissent (le « <b>Contrat</b> ») :
                    -	les modalités d’utilisation de ses Services,
                    -	les obligations respectives des parties.
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: "bold"}}>Emplacement des Conditions Générales </td>
                    <td>Le Client peut les trouver par un lien direct en bas de page de la Plateforme.</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: "bold"}}>Modalités d’acceptation des Conditions Générales </td>
                    <td>Le Client accepte les Conditions Générales en cochant une case dans le formulaire d’inscription. S’il n’accepte pas l’intégralité des Conditions Générales, il ne peut pas accéder aux Services.

                    Elles peuvent être complétées par des conditions particulières, qui, en cas de contradiction, prévalent sur les Conditions Générales.
                    </td>
                  </tr>
                </tbody>
            </Table>
            </li>
            <li className="mt-5">
              <h5 style={{ fontWeight: "bold", fontSize: "16px", color: "black"}}>4.	DÉFINITIONS </h5>
              <p style={{ marginTop: "15px", fontSize: "16px"}}>Pour l’exécution du présent Contrat, outre les termes définis par ailleurs dans le présent document, les termes commençant par une majuscule ont la signification indiquée ci-dessous, qu’ils soient au singulier ou au pluriel :
                <br /><br /><b>« Contenu Client »</b> désigne toute information, donnée, document et, de manière générale, tout contenu mis en ligne sur les Services à l’initiative du Client et sous sa seule responsabilité.
                <br /><br /><b>« Contrat »</b> désigne le présent document, ses annexes et tout avenant conclu entre les Parties qui viendrait le ou les modifier.
                <br /><br /><b>« Identifiants »</b> désigne, selon la méthode d’accès sélectionnée par le Client, (i) l’identifiant propre de chaque Client ("login") et le mot de passe y afférent communiqués par Fullsoon et permettant au Client de se connecter aux Services, ou (ii) le processus d’authentification unique (connexion SSO) utilisé par le Client pour se connecter aux Services. 
                <br /><br /><b>« Services »</b> désignent les services fournis par Fullsoon au titre du Contrat, à savoir la mise à disposition de la solution accessible à distance en mode SaaS et les services de maintenance et de support associés tels que décrits dans la Documentation. Les Services n’incluent pas les prestations additionnelles, telles que des prestations de développement, d’intégration de paramétrage, de consulting et de formation. 
                <br /><br /><b>« Utilisateur »</b> désigne toute personne physique habilitée par le Client à accéder à et utiliser les Services, pour les seuls besoins internes du Client et sous la responsabilité exclusive de ce dernier.
            </p>
            </li> 
            <li className="mt-5">
              <h5 style={{ fontWeight: "bold", fontSize: "16px", color: "black"}}>5.	CONDITIONS D'ACCÈS AUX SERVICES </h5>
              <p style={{ marginTop: "15px", fontSize: "16px"}}>Le Client est : <br /><br />-	une <b>personne morale</b> agissant par l’intermédiaire d’une personne physique disposant du pouvoir ou de l’habilitation requise pour contracter au nom du Client et pour son compte ; <br /><br />-	-	un <b>professionnel,</b> entendu comme toute personne physique ou morale agissant à des fins entrant dans le cadre de son activité commerciale, industrielle, artisanale, libérale ou agricole, y compris lorsqu'elle agit au nom ou pour le compte d'un autre professionnel</p>
            </li>
            <li className="mt-5">
              <h5 style={{ fontWeight: "bold", fontSize: "16px", color: "black"}}>6.	DOCUMENTS CONTRACTUELS </h5>
              <p style={{ marginTop: "15px", fontSize: "16px"}}><b style={{marginRight: "10px"}}>6.1</b>&#160;&#160;&#160;&#160; Le Contrat est composé des documents suivants :
                <ol>
                  <li>(i) Les Conditions générales ;</li>
                  <li>(ii)	La Documentation figurant en Annexe.</li>
                </ol>
                <b>6.2</b>&#160;&#160;&#160;&#160;	Toute modification du Contrat fera l’objet d’un avenant écrit convenu d’un commun accord entre les Parties. <br />
                <b>6.3</b>&#160;&#160;&#160;&#160;	Le Contrat exprime l’intégralité de l’accord des Parties quant à son objet. Il annule et remplace tout accord, déclaration, négociation, engagement, communication, oral ou écrit, antérieur, quel que soit le moment et/ou le support de leur communication. Les Parties écartent expressément l’application des conditions générales du Client.
              </p>
            </li>  
            <li className="mt-5">
              <h5 style={{ fontWeight: "bold", fontSize: "16px", color: "black"}}>7.	DUREE DE SOUSCRIPTION AUX SERVICES </h5>
              <p style={{ marginTop: "15px", fontSize: "16px"}}><b>7.1</b>&#160;&#160;&#160;&#160;	Le Client souscrit aux Services sous forme d’abonnement <b>(l’« Abonnement »)</b>. <br />
              <b>7.2</b>&#160;&#160;&#160;&#160;	L’Abonnement débute au jour de sa souscription pour une période initiale (la « <b>Durée initiale</b> ») indiquée sur la Plateforme. <br /> <br />
              Il se renouvelle tacitement, pour des périodes successives de même durée que la période initiale (avec la période initiale, les « Périodes »), de date à date, sauf si l’Abonnement est dénoncé dans les conditions de l’article « Fin des Services ». 
              </p>
            </li>
            <li className="mt-5">
              <h5 style={{ fontWeight: "bold", fontSize: "16px", color: "black"}}>8.	PÉRIMÈTRE DE LA LICENCE</h5>
              <p style={{ marginTop: "15px", fontSize: "16px"}}><b>8.1</b>&#160;&#160;&#160;&#160;	En contrepartie du paiement de la redevance annuelle, Fullsoon concède au Client un droit d’accès et d’utilisation des Services, à titre non-exclusif, non-transférable, pour les seuls besoins professionnels internes du Client, pour la durée du Contrat et la France selon les modalités et conditions définies ci-après. <br /> <br />
              <b>8.2</b>&#160;&#160;&#160;&#160;	La licence ainsi concédée inclut le droit pour le Client de permettre à ses Utilisateurs d’accéder à et d’utiliser les Services conformément au présent Contrat et à la Documentation. Le Client s’engage à respecter et à ce que les Utilisateurs respectent l’ensemble des conditions d’utilisation des Services et les termes du présent Contrat. De même, le Client s’engage à contrôler l’accès des Utilisateurs aux Services et à s’assurer qu’ils les utilisent en conformité avec le présent Contrat. À ce titre, le Client se porte fort du respect des conditions d’utilisation des Services et des termes du présent Contrat par les Utilisateurs. <br /><br />
              <b>8.3</b>&#160;&#160;&#160;&#160;	Sous réserve de ce qui est expressément autorisé dans le cadre du présent Contrat, le Client s’engage à ne pas, et à ce que ses Utilisateurs s’interdisent de : <br />
              <b>(i)</b>	accéder à et/ou utiliser les Services à d’autres fins que celles strictement prévues au sein du présent Contrat, et notamment afin de : <br />
              &#160;&#160;a.	fournir des prestations à des tiers (par exemple en qualité de service bureau ou de centre de services partagés), <br />
              &#160;&#160;b.	contourner ou de désactiver toute fonctionnalité ou mesure de sécurité ou technique des Services, <br />
              &#160;&#160;c.	transmettre des virus, vers, chevaux de Troie ou tout autre logiciel malveillant susceptible de nuire aux Services, à Fullsoon ou à tout autre utilisateur des Services ; <br />
              <b>(ii)</b>	modifier, adapter, altérer, traduire ou créer une œuvre dérivée à partir des Services ou un composant de ceux-ci ; <br />
              <b>(iii)</b>	sous-licencier, exposer, vendre, permettre une utilisation à temps partiel <b>(« time</b>-sharing »), louer, prêter ou autrement transférer les Services à un tiers ; <br />
              <b>(iv)</b>	faire de l’ingénierie inverse, décompiler, désassembler, ou tenter d’obtenir le code source des Services, sauf dans la mesure permise par la loi applicable ; <br />
              <b>(v)</b>	permettre l’accès aux Services à toute personne autre que les Utilisateurs, le Client reconnaissant à ce titre être responsable de la maitrise de ses moyens d’accès aux Services ; <br />
              <b>(vi)</b>	interférer ou perturber les performances des Services <b>(en effectuant</b> par exemple par des tests d’intrusion) ; <br />
              <b>(vii)</b>	corriger des erreurs, défauts et toute autre anomalie des Services ; <br />
              <b>(viii)</b>	porter atteinte aux intérêts légitimes de Fullsoon et/ou de ses concédants et notamment à leurs droits de propriété intellectuelle et autres droits relatifs ou liés aux Services ;  <br />
              <b>(ix)</b>	supprimer ou modifier la marque, le logo ou tout autre signe distinctif de Fullsoon contenus dans les Services. <br /> <br />
              </p>
            </li>
            <li className="mt-5">
              <h5 style={{ fontWeight: "bold", fontSize: "16px", color: "black"}}>9.	CONDITIONS DE FOURNITURE DES SERVICES</h5>
              <p style={{ marginTop: "15px", fontSize: "16px"}}><b>9.1</b>&#160;&#160;&#160;&#160;	Pendant la durée du Contrat, Fullsoon s’engage, au titre d’une obligation de moyens, à : <br /> <br />
              <b>(i)</b>	fournir des Services substantiellement conformes à la Documentation ; <br />
              <b>(ii)</b>	faire ses meilleurs efforts raisonnables pour que les Services soient disponibles, sous réserve des dispositions des présentes, et notamment de l’article 12.4 ci-dessous ; <br />
              <b>(iii)</b>	faire ses meilleurs efforts raisonnables pour prendre en compte et traiter toute anomalie reproductible portant sur les Services, dans les meilleurs délais.<br /><br />
              <b>9.2</b>&#160;&#160;&#160;&#160;	À tout moment et à son entière discrétion, Fullsoon peut modifier le contenu, les fonctionnalités et les interfaces utilisateur des Services. Fullsoon fera ses meilleurs efforts pour informer le Client, par tout moyen, préalablement à sa mise en œuvre, de toute modification majeure des Services prévue qui, selon Fullsoon, aurait un impact fonctionnel négatif sur l’utilisation des Services par le Client. Pendant toute la durée du Contrat, Fullsoon s’engage à ne pas réduire substantiellement les fonctionnalités des Services. <br /><br />
              <b>9.3</b>&#160;&#160;&#160;&#160;	Fullsoon peut mettre en œuvre des améliorations aux fonctionnalités existantes et de nouvelles fonctionnalités à tout moment et à son entière discrétion. Certaines fonctionnalités peuvent n’être disponibles qu’avec certaines versions ou éditions des Services, sous réserve du paiement de frais supplémentaires et/ou soumis à des conditions particulières supplémentaires. <br /> <br />
              </p>
            </li>
            <li className="mt-5">
              <h5 style={{ fontWeight: "bold", fontSize: "16px", color: "black"}}>10.	MODALITES D’ACCES ET DE SOUSCRIPTION AUX SERVICES </h5>
              <p style={{ marginTop: "15px", fontSize: "16px"}}><b>10.1</b>&#160;&#160;&#160;&#160;	Pour souscrire les Services, le Client doit remplir le formulaire prévu à cet effet sur la Plateforme.<br /> <br />
              <b>10.2</b>&#160;&#160;&#160;&#160;	Le Client doit fournir à la Société l’ensemble des informations marquées comme obligatoires. <br /><br />
              <b>10.3</b>&#160;&#160;&#160;&#160;	L’inscription entraîne automatiquement l’ouverture d’un compte au nom du Client (le « <b>Compte</b> ») qui lui permet d’accéder aux offres de Services à l’aide de son identifiant de connexion et de son mot de passe. <br /> <br />
              </p>
            </li>
            <li className="mt-5">
              <h5 style={{ fontWeight: "bold", fontSize: "16px", color: "black"}}>11.	CONDITIONS D’ACCÈS ET D’UTILISATION DES SERVICES</h5>
              <p style={{ marginTop: "15px", fontSize: "16px"}}><b>11.1</b>&#160;&#160;&#160;&#160;	Le Client est seul responsable de l’accès aux Services. Il lui appartient de prendre toutes les mesures nécessaires pour maintenir cet accès. Notamment, il appartient au Client d’obtenir et de maintenir, pendant la durée du Contrat, l’ensemble des équipements nécessaires pour accéder aux Services, en ce compris une connexion au réseau internet. Fullsoon ne peut être tenue responsable de toute défaillance ou difficulté d’accès aux Services due à un dysfonctionnement matériel ou à la connexion au réseau internet du Client. <br /> <br />
              <b>11.2</b>&#160;&#160;&#160;&#160;	Il appartient au Client de désigner uniquement des Utilisateurs de confiance qui, a priori et compte tenu de leurs fonctions et profil, ne sont pas susceptibles de détourner les Services et de les utiliser à des fins malveillantes, étant entendu qu’en tout état de cause, l’utilisation des Services se fait sous la responsabilité exclusive du Client. <br /><br />
              <b>11.3</b>&#160;&#160;&#160;&#160;	L’accès aux Services s’effectue à partir des équipements du Client au moyen des Identifiants. Ces Identifiants sont personnels et confidentiels. Ils sont utilisés sous la seule responsabilité du Client. Il est précisé que dans le cas où les Identifiants sont fournis au Client par Fullsoon, cette dernière se réserve le droit de les modifier pour des raisons de sécurité et sous réserve d’en informer préalablement le Client.  <br /> <br />
              <b>11.4</b>&#160;&#160;&#160;&#160;	Le Client est seul responsable de toute utilisation des Services par les Utilisateurs ainsi que de tout accès et utilisation des Services par quiconque via les Identifiants. Il contrôle l’accès des Utilisateurs aux Services et s’assure qu’ils l’utilisent en conformité avec le Contrat. Toutes conséquences préjudiciables résultant de la divulgation ou d’un accès non autorisé aux Identifiants devront être intégralement réparées par le Client. <br /><br />
              <b>11.5</b>&#160;&#160;&#160;&#160;	Le Client doit informer immédiatement Fullsoon de toute utilisation non-conforme des Identifiants et/ou des Services et de toute violation de sécurité liée aux Identifiants (en ce compris notamment perte ou vol des Identifiants) dont il aurait connaissance ou qu’il soupçonnerait. Dans ce cas, le Client s’engage à collaborer avec Fullsoon pour prendre toutes les mesures et actions appropriées pour remédier à une telle utilisation non-conforme ou violation de sécurité. <br /><br />
              <b>11.6</b>&#160;&#160;&#160;&#160;	Le Client est également responsable du respect de toute règlementation applicable à l’utilisation des Services par lui-même et/ou les Utilisateurs. <br /><br />
              <b>11.7</b>&#160;&#160;&#160;&#160;	En cas d’utilisation par le Client ou tout Utilisateur des Services de manière non-conforme au Contrat, à la règlementation applicable ou à la Documentation, ou si Fullsoon estime que cette utilisation constitue une menace pour la sécurité, l’intégrité ou la disponibilité des Services, Fullsoon pourra immédiatement suspendre l’accès aux Services du Client et/ou des Utilisateurs. Fullsoon fera ses efforts raisonnables, selon les circonstances, pour informer le Client de cette suspension au préalable et lui permettre de remédier à ce manquement ou supprimer une telle menace dans les plus brefs délais. <br /><br />
              </p>
            </li>
            <li className="mt-5">
              <h5 style={{ fontWeight: "bold", fontSize: "16px", color: "black"}}>12.	PRESTATIONS COMPLÉMENTAIRES</h5>
              <p style={{ marginTop: "15px", fontSize: "16px"}}><b>12.1</b>&#160;&#160;&#160;&#160;	À la demande du Client, Fullsoon pourra fournir des prestations complémentaires au Client en ce compris notamment d’assistance, de conseil, de formation, de développement informatique. Ces prestations complémentaires donneront alors lieu à commande spécifique ainsi qu’à un devis correspondant émis par Fullsoon et accepté par le Client. <br /> <br />
              <b>12.2</b>&#160;&#160;&#160;&#160;	Les Services et les prestations complémentaires sont indépendants. La fourniture des Services n’est donc pas conditionnée à la souscription par le Client de prestations complémentaires. <br /><br />
              <b>12.3</b>&#160;&#160;&#160;&#160;	Le Client reconnaît que Fullsoon n’est aucunement tenue d’accepter la fourniture de prestations complémentaires demandées par le Client. Fullsoon est notamment libre de soumettre la conclusion d’un bon de commande pour la fourniture de prestations complémentaires à une étude de faisabilité. <br /> <br />
              </p>
            </li>
            <li className="mt-5">
              <h5 style={{ fontWeight: "bold", fontSize: "16px", color: "black"}}>13.	OBLIGATIONS DU CLIENT</h5>
              <p style={{ marginTop: "15px", fontSize: "16px"}}><b>13.1</b>&#160;&#160;&#160;&#160;	Le Client est informé que les Services constituent des services standard conçus pour des entreprises de taille variable. Il appartient dès lors au Client, préalablement à l’acceptation des Conditions générales, de :  <br /> <br />
              <b>(i)</b>	définir précisément ses besoins ; <br />
              <b>(ii)</b>	vérifier que les Services correspondent à la définition de ses besoins ; et  <br />
              <b>(iii)</b>	s’assurer que les Services sont dimensionnés dans une mesure qui lui permette de remplir ses objectifs professionnels propres. <br /><br />
              <b>13.2</b>&#160;&#160;&#160;&#160;	Durant toute la durée du Contrat, le Client s’engage à collaborer loyalement et activement avec Fullsoon, en particulier, à lui communiquer et/ou lui permettre d’accéder aux informations, documents et tous autres éléments nécessaires à la fourniture des Services. La fourniture des Services par Fullsoon dépend de la coopération, en temps et en heure et aussi complète que possible, que le Client peut apporter ainsi que de la précision et de l’exhaustivité de toutes informations que le Client fournit. <br /> <br />
              <b>13.3</b>&#160;&#160;&#160;&#160;	Le Client s’engage à détenir toutes les autorisations et habilitations légales, administratives, règlementaires et/ou contractuelles nécessaires à l’exécution du Contrat. Ces autorisations et habilitations sont sous la responsabilité exclusive du Client.  <br /> <br />
              <b>13.4</b>&#160;&#160;&#160;&#160;	Le Client garantit expressément qu’il dispose de tous les droits et pouvoirs pour utiliser les Services. <br /> <br />
              <b>13.5</b>&#160;&#160;&#160;&#160;	Les appareils, matériels, logiciels, supports d’information que le Client utilise et/ou fournit dans le cadre de la fourniture des Services devront satisfaire à tous prérequis communiqués par Fullsoon. En tout état de cause, le Client s’engage à respecter les spécifications qui lui seront communiquées par Fullsoon pendant la durée du Contrat. <br /> <br />
              <b>13.6</b>&#160;&#160;&#160;&#160;	Le Client reconnaît avoir été informé par Fullsoon que la mise en œuvre et la bonne utilisation des Services est susceptible de dépendre de la capacité du Client à former au préalable ses Utilisateurs à l’usage des Services. <br /> <br />
              <b>13.7</b>&#160;&#160;&#160;&#160;	Pendant toute la durée du Contrat, le Client s’engage à désigner un ou plusieurs interlocuteur(s) dédié(s) et compétent(s) afin d’être le ou les point(s) de contact de Fullsoon pour toute question relation aux Services et/ou au Contrat. <br /> <br />
              <b>13.8</b>&#160;&#160;&#160;&#160;	Le Client reconnaît et accepte que les Services n’ont pas vocation à être utilisés pour sécuriser et sauvegarder les données du Client et à se substituer à toute méthode de sauvegarde et de sécurisation des données. Le Client s’engage à ce titre à prendre toutes les mesures nécessaires pour assurer une sauvegarde régulière de ses données et dégage toute responsabilité de Fullsoon à ce titre. <br /> <br />
              </p>
            </li>
            <li className="mt-5">
              <h5 style={{ fontWeight: "bold", fontSize: "16px", color: "black"}}>14.	MODALITÉS FINANCIÈRES</h5>
              <p style={{ marginTop: "15px", fontSize: "16px"}}><b>14.1</b>&#160;&#160;&#160;&#160;	Les prix des Services auxquels le Client a souscrit sont indiqués  et sélectionnés directement sur la Plateforme.<br /> <br />
              <b>14.2</b>&#160;&#160;&#160;&#160;	Toute période entamée est due dans son intégralité. <br /><br />
              <b>14.3</b>&#160;&#160;&#160;&#160;	La Société est libre de proposer des offres promotionnelles ou des réductions de prix. <br /><br />
              <b>14.4</b>&#160;&#160;&#160;&#160;	Le prix des Services comprend des frais initiaux d’implémentation et des frais récurrents, tels que détaillés sur la Plateforme. Tous les prix indiqués sont hors taxes et sont majorés de la TVA au taux en vigueur au jour de la facturation. <br /><br />
              <b>14.5</b>&#160;&#160;&#160;&#160;	Les frais initiaux d’implémentation sont facturés à hauteur de <b>750 euros</b> sauf réduction exceptionnelle. <br /><br />
              <b>14.6</b>&#160;&#160;&#160;&#160;	Le prix des Services ne comprend pas les frais de déplacement et/ou hébergement engagés par Fullsoon pour la fourniture des Services, qui seront intégralement remboursés par le Client sur présentation des justificatifs correspondants par Fullsoon. <br /><br />
              <b>14.7</b>&#160;&#160;&#160;&#160;	Les prix sont fermes, non-révisables et non-remboursables pour la Durée Initiale, sauf mention contraire des présentes. Dans un délai de trois (3) mois avant la fin de la Durée Initiale (ou de la Période de Renouvellement en cours, selon le cas), Fullsoon pourra contacter le Client afin de convenir conjointement de nouveaux prix applicables pour la prochaine Période de Renouvellement. Si les Parties ne parviennent pas à s’accorder sur lesdits nouveaux prix, le Client ou Fullsoon pourra dénoncer le présent Contrat dans les conditions prévues aux présentes. <br /><br />
              <b>14.8</b>&#160;&#160;&#160;&#160;	Les frais récurrents sont facturés comme suit : <br />
                          -	en cas de facturation annuelle, Fullsoon émettra sa facture annuellement terme à échoir, à la date d’acceptation des Conditions générales, puis à chaque date anniversaire ; 
               <br /><br />
              <b>14.9</b>&#160;&#160;&#160;&#160;	en cas de facturation mensuelle : Fullsoon émettra ses factures mensuellement au terme échu, au plus tard le 12 de chaque mois et les enverra au Client à l’adresse email  <br /><br />
              <b>14.10</b>&#160;&#160;&#160;&#160;	Les factures sont payables à Fullsoon dans un délai de trente (30) jours à compter de la date d’émission de la facture.  <br /><br />
              Sauf disposition contraire dans le présent Contrat, toutes les obligations de paiement du prix sont non-annulables et non-remboursables et le Client doit effectuer les paiements sans compensation, retenues ou déductions d’aucune sorte. <br /><br />
              <b>14.11</b>&#160;&#160;&#160;&#160;	Les factures seront établies par Fullsoon et adressées par courriel au Client. <br /><br />
              <b>14.12</b>&#160;&#160;&#160;&#160;	Le paiement est effectué par prélèvement automatique [à la souscription de l’Abonnement, puis à chaque renouvellement] OU [mensuellement à compter de la souscription de l’Abonnement]. <br /><br />
              <b>14.13</b>&#160;&#160;&#160;&#160;	Le Client garantit à Fullsoon disposer des autorisations nécessaires pour utiliser ce mode de paiement. <br /><br />
              <b>14.14</b>&#160;&#160;&#160;&#160;	Tout retard de paiement donnera lieu, de plein droit, sans mise en demeure préalable, au paiement d’un intérêt de retard égal à trois (3) fois le taux d’intérêt légal en France, calculé par jour de retard à compter de la date d’échéance figurant sur la facture impayée jusqu’à la date du paiement effectif. Une indemnité forfaitaire pour frais de recouvrement d’un montant de quarante (40) euros (ou tout autre montant fixé par la règlementation applicable) sera exigible de plein droit en cas de recouvrement, nonobstant le remboursement des frais réels de recouvrement, justifiés sur facture. <br /><br />
              <b>14.15</b>&#160;&#160;&#160;&#160;	En outre et sans préjudice d’éventuels dommages et intérêts, en cas de non-paiement du prix à la date d’échéance de la facture correspondante, Fullsoon sera en droit de (i) suspendre l’accès aux Services de manière temporaire jusqu’au règlement du prix, et/ou (ii) résilier de plein droit le Contrat, sans préjudice de tout autre droit et/ou recours de Fullsoon, dans un délai de dix (10) jours ouvrés après mise en demeure adressée au Client par lettre recommandée avec avis de réception.  <br /><br />
              <b>14.16</b>&#160;&#160;&#160;&#160;	Le respect du présent article est une obligation essentielle du Contrat. <br /><br />
              </p>
            </li>
          </ul>
      </Modal.Body>
      <Modal.Footer>
      <div style={{ width: "auto", padding: "20px", display: "flex", justifyContent: "space-around", alignItems: "center"}}>
          <input type='checkbox' name='terms' style={{ marginRight: "10px", cursor: "pointer"}}/>
          <span>I accept the <span style={{ textDecoration: "underline", fontWeight: "bold", cursor: "pointer"}}><em>terms and conditions.</em></span></span>
			</div>
      </Modal.Footer>
    </Modal>
  );
}

export default TermsModal;
